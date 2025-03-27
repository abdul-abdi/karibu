import { NextRequest, NextResponse } from 'next/server';
import {
  PrivateKey,
  ContractCreateTransaction,
  Hbar,
  ContractFunctionParameters,
  Long,
  AccountBalanceQuery,
  Status
} from '@hashgraph/sdk';
import dotenv from 'dotenv';
import { 
  getHederaCredentials,
  initializeClient, 
  validateHederaCredentials 
} from '../../utils/hedera';
import { 
  withRetry, 
  logError, 
  prepareContractForDeployment
} from '../../utils/helpers';

// Load environment variables
dotenv.config();

// Default gas limit for large contract deployment
const DEFAULT_LARGE_GAS_LIMIT = 15000000; // Increased to match main deploy route

// Simple in-memory status store - for production use Redis or a database
const deploymentStatuses = new Map<string, {
  status: 'pending' | 'completed' | 'error';
  contractId?: string;
  contractAddress?: string;
  error?: string;
  timestamp: number;
}>();

// Cleanup function to prevent memory leaks
const CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
const STATUS_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Periodically clean up old deployment statuses
function cleanupDeploymentStatuses() {
  const now = Date.now();
  let cleanedCount = 0;
  
  deploymentStatuses.forEach((status, id) => {
    // Remove statuses older than the expiry time
    if (now - status.timestamp > STATUS_EXPIRY) {
      deploymentStatuses.delete(id);
      cleanedCount++;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired deployment statuses`);
  }
  
  // Schedule next cleanup
  setTimeout(cleanupDeploymentStatuses, CLEANUP_INTERVAL);
}

// Start the cleanup process
setTimeout(cleanupDeploymentStatuses, CLEANUP_INTERVAL);

// Helper function to handle transaction with retries
async function executeWithRetry(operation, maxRetries = 3, initialDelay = 1000) {
  let attempt = 0;
  let lastError;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if this is a retriable error
      const isRetriable = 
        error.status === Status.Unknown || 
        error.status === Status.Busy || 
        error.status === Status.ReceiptNotFound ||
        error.message?.includes('network error') ||
        error.message?.includes('timeout');
      
      if (!isRetriable) {
        throw error; // Don't retry non-retriable errors
      }
      
      attempt++;
      console.warn(`Attempt ${attempt}/${maxRetries} failed: ${error.message || 'Unknown error'}`);
      
      if (attempt >= maxRetries) break;
      
      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Operation failed after maximum retries');
}

// Helper function to check account balance
async function checkAccountBalance(client, operatorId) {
  try {
    const query = new AccountBalanceQuery()
      .setAccountId(operatorId);
    
    const accountBalance = await query.execute(client);
    console.log(`Operator account balance: ${accountBalance.hbars.toString()}`);
    
    // Warn if balance is low
    const lowBalanceThreshold = Long.fromString("5000000000"); // 50 HBAR
    if (accountBalance.hbars.toTinybars().lessThan(lowBalanceThreshold)) {
      console.warn(`WARNING: Low account balance (${accountBalance.hbars.toString()}). Contract deployment may fail.`);
    }
    
    return accountBalance.hbars;
  } catch (error) {
    console.error('Failed to check account balance:', error);
    // Don't fail the deployment process if balance check fails
    return null;
  }
}

/**
 * Direct deployment endpoint for large contracts
 * This approach avoids the file service chunking approach and instead
 * uses direct bytecode deployment with optimized gas settings
 */
export async function POST(req: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Parse request body
    const data = await req.json();
    const { 
      bytecode, 
      abi, 
      constructorArgs = [],
      gas = DEFAULT_LARGE_GAS_LIMIT,
      deploymentId = `deployment-${Date.now()}`,
      operatorId: customOperatorId, 
      operatorKey: customOperatorKey
    } = data;
    
    // Validate request
    if (!bytecode) {
      return NextResponse.json({ error: 'Missing bytecode' }, { status: 400 });
    }
    
    // Store initial status
    deploymentStatuses.set(deploymentId, {
      status: 'pending',
      timestamp: Date.now()
    });
    
    // Prep bytecode but use the original bytecode for deployment
    const preparedContract = prepareContractForDeployment(bytecode, abi);
    // Use the original bytecode instead of the optimized one
    const bytecodeForDeployment = bytecode; // Use original instead of preparedContract.bytecode
    
    // Get Hedera credentials
    const { operatorId, operatorKey } = customOperatorId && customOperatorKey 
      ? { operatorId: customOperatorId, operatorKey: customOperatorKey }
      : getHederaCredentials();
    
    // Initialize client - with retry for connection issues
    const client = await withRetry(() => initializeClient(operatorId, operatorKey));
    
    // Check account balance before proceeding
    await checkAccountBalance(client, operatorId);
    
    // Create the private key object for signing with better format detection
    let privateKey;
    try {
      // First try to parse as ED25519 key which is recommended for Hedera
      if (operatorKey.startsWith('302e020100300506032b657004')) {
        privateKey = PrivateKey.fromStringDer(operatorKey);
        console.log("Using DER format private key");
      } else {
        privateKey = PrivateKey.fromStringED25519(operatorKey);
        console.log("Using ED25519 format private key");
      }
    } catch (error) {
      console.warn("Falling back to generic key parsing method");
      privateKey = PrivateKey.fromString(operatorKey);
    }
    
    // Clean bytecode format
    const bytecodeHex = bytecodeForDeployment.startsWith('0x') 
      ? bytecodeForDeployment.slice(2) 
      : bytecodeForDeployment;
    
    // Convert to buffer once
    const bytecodeBuffer = Buffer.from(bytecodeHex, 'hex');
    
    // Log deployment attempt with more details
    console.log(`[${deploymentId}] Direct contract deployment started`);
    console.log(`Bytecode size: ${bytecodeBuffer.length} bytes (${Math.ceil(bytecodeBuffer.length/1024)} KB)`);
    console.log(`Using gas limit: ${gas}`);
    
    // Create transaction with higher gas limit and max transaction fee
    let contractCreateTx = new ContractCreateTransaction()
      .setGas(gas)
      .setBytecode(bytecodeBuffer)
      .setMaxTransactionFee(new Hbar(20)); // Reduced from 100 HBAR to improve reliability
    
    // Add constructor parameters if any
    if (constructorArgs.length > 0) {
      // Find constructor definition from ABI
      const constructorDef = abi.find(item => item.type === 'constructor');
      if (constructorDef) {
        // Create parameters object
        let params = new ContractFunctionParameters();
        
        // Add each parameter according to its type
        constructorDef.inputs.forEach((input, index) => {
          const value = constructorArgs[index];
          switch (input.type) {
            case 'string':
              params = params.addString(value);
              break;
            case 'address':
              params = params.addAddress(value);
              break;
            case 'bool':
              params = params.addBool(Boolean(value));
              break;
            case 'uint8':
              params = params.addUint8(Number(value));
              break;
            case 'uint16':
              params = params.addUint16(Number(value));
              break;
            case 'uint32':
              params = params.addUint32(Number(value));
              break;
            case 'uint64':
              // Convert BigInt to Long for Hedera SDK
              params = params.addUint64(Long.fromString(value.toString()));
              break;
            case 'uint256':
              // Convert BigInt to string for Hedera SDK
              params = params.addUint256(value.toString());
              break;
            case 'int8':
              params = params.addInt8(Number(value));
              break;
            case 'int16':
              params = params.addInt16(Number(value));
              break;
            case 'int32':
              params = params.addInt32(Number(value));
              break;
            case 'int64':
              // Convert BigInt to Long for Hedera SDK
              params = params.addInt64(Long.fromString(value.toString()));
              break;
            case 'int256':
              // Convert BigInt to string for Hedera SDK
              params = params.addInt256(value.toString());
              break;
            case 'bytes32':
              params = params.addBytes32(value);
              break;
            // Add more types as needed
            default:
              if (input.type.includes('[]')) {
                // Handle array types - only support string arrays and address arrays
                // which are the most common in constructor params
                if (input.type === 'string[]') {
                  params = params.addStringArray(value);
                } else if (input.type === 'address[]') {
                  params = params.addAddressArray(value);
                } else {
                  console.warn(`Array type ${input.type} not directly supported. Converting to bytes.`);
                  // Fallback to bytes for unsupported array types
                  const bytesValue = Buffer.from(JSON.stringify(value));
                  params = params.addBytes(bytesValue);
                }
              } else {
                console.warn(`Unsupported parameter type: ${input.type}`);
                // Default to bytes for unknown types
                params = params.addBytes(Buffer.from(value.toString()));
              }
          }
        });
        
        // Set constructor parameters
        contractCreateTx = contractCreateTx.setConstructorParameters(params);
      }
    }
      
    console.log(`[${deploymentId}] Signing transaction`);
    const contractCreateSign = await contractCreateTx.freezeWith(client).sign(privateKey);
    
    console.log(`[${deploymentId}] Executing transaction with retry logic`);
    
    // Execute transaction with retry logic
    const contractCreateSubmit = await executeWithRetry(async () => {
      return await contractCreateSign.execute(client);
    });
    
    console.log(`[${deploymentId}] Transaction executed, getting receipt with retry logic`);
    
    // Get receipt with retry logic
    const contractReceipt = await executeWithRetry(async () => {
      return await contractCreateSubmit.getReceipt(client);
    });
    
    const contractId = contractReceipt.contractId;
    
    if (!contractId) {
      throw new Error('Contract deployment failed: No contract ID received');
    }
    
    console.log(`[${deploymentId}] Successfully deployed contract with ID: ${contractId.toString()}`);
    
    // Update status to completed
    deploymentStatuses.set(deploymentId, {
      status: 'completed',
      contractId: contractId.toString(),
      contractAddress: contractId.toSolidityAddress(),
      timestamp: Date.now()
    });
    
    // Return success
    return NextResponse.json({
      success: true,
      deploymentId,
      contractId: contractId.toString(),
      contractAddress: contractId.toSolidityAddress(),
      executionTime: Date.now() - startTime,
      optimization: {
        originalSize: preparedContract.size.original,
        optimizedSize: preparedContract.size.optimized,
        savingsPercent: preparedContract.size.savingsPercent.toFixed(2)
      }
    });
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error in direct deployment:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code || 'none',
      statusCode: error.statusCode || 'none',
      status: error.status || 'none',
      transactionId: error.transactionId || 'none',
      type: typeof error
    });
    
    const errorMessage = error.message || 'Unknown error';
    const deploymentId = error.deploymentId || `error-${Date.now()}`;
    
    // Update status to error with detailed information
    if (deploymentId) {
      deploymentStatuses.set(deploymentId, {
        status: 'error',
        error: errorMessage,
        timestamp: Date.now()
      });
    }
    
    // Provide more helpful error message based on the error type
    let clientFriendlyMessage = errorMessage;
    
    if (errorMessage.includes('2 UNKNOWN')) {
      clientFriendlyMessage = 'Transaction submitted but status is unknown. This often resolves itself, please check for your contract in a few minutes.';
    } else if (errorMessage.includes('INSUFFICIENT_TX_FEE')) {
      clientFriendlyMessage = 'The transaction fee is too low. Try again with a higher gas limit.';
    } else if (errorMessage.includes('INSUFFICIENT_PAYER_BALANCE')) {
      clientFriendlyMessage = 'Your account does not have enough HBAR. Please obtain more HBAR from a faucet.';
    } else if (errorMessage.includes('CONTRACT_REVERT_EXECUTED')) {
      clientFriendlyMessage = 'Smart contract reverted during construction. Check your constructor logic and parameters.';
    }
    
    // Return error response with improved client-friendly message
    return NextResponse.json({
      success: false,
      error: clientFriendlyMessage,
      deploymentId,
      originalError: errorMessage
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check deployment status
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const deploymentId = url.searchParams.get('id');
  
  if (!deploymentId) {
    return NextResponse.json({ error: 'Missing deployment ID' }, { status: 400 });
  }
  
  const status = deploymentStatuses.get(deploymentId);
  
  if (!status) {
    return NextResponse.json({ error: 'Deployment not found' }, { status: 404 });
  }
  
  // Return status info
  return NextResponse.json({
    deploymentId,
    status: status.status,
    contractId: status.contractId,
    contractAddress: status.contractAddress,
    error: status.error,
    timestamp: status.timestamp
  });
} 