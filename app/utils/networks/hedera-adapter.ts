import { 
  Client, 
  ContractCreateFlow, 
  ContractCallQuery, 
  ContractExecuteTransaction, 
  ContractFunctionParameters, 
  AccountId, 
  PrivateKey, 
  Long, 
  AccountBalanceQuery
} from '@hashgraph/sdk';
import { NetworkConfig, NetworkStatus } from '../../types/network';
import { BlockchainTransactionResult, ContractCallParams, DeploymentParams, NetworkAdapter } from './network-adapter';
import { formatContractId } from '../hedera';
import { formatToEvmAddress, formatToEvmAddressAsync, getContractInfoFromMirrorNode } from '../contract-utils';

/**
 * Hedera network adapter
 */
export class HederaAdapter implements NetworkAdapter {
  private config: NetworkConfig;
  private client: Client | null = null;
  private operatorId: string | null = null;
  private operatorKey: string | null = null;
  private status: NetworkStatus = NetworkStatus.DISCONNECTED;

  constructor(config: NetworkConfig) {
    this.config = config;
    
    // Extract credentials from config
    if (config.hederaConfig) {
      this.operatorId = config.hederaConfig.operatorId || null;
      this.operatorKey = config.hederaConfig.operatorKey || null;
    }
  }

  /**
   * Get the network configuration
   */
  getConfig(): NetworkConfig {
    return this.config;
  }

  /**
   * Initialize the Hedera client
   */
  async initialize(): Promise<boolean> {
    try {
      this.status = NetworkStatus.CONNECTING;
      
      // Validate credentials
      if (!this.operatorId || !this.operatorKey || 
          this.operatorId.includes('YOUR_ACCOUNT_ID') || 
          this.operatorKey.includes('YOUR_PRIVATE_KEY')) {
        console.warn('Hedera credentials not properly configured. Operating in read-only mode.');
        console.warn('To enable full Hedera functionality, please configure:');
        console.warn('- HEDERA_OPERATOR_ID: Your Hedera account ID (e.g., 0.0.12345)');
        console.warn('- HEDERA_OPERATOR_KEY: Your Hedera private key');
        console.warn('You can still view contracts and interact with the network in read-only mode.');
        
        this.status = NetworkStatus.DISCONNECTED;
        // Return true to allow read-only operations
        return true;
      }
      
      try {
        // Create the Hedera client using the NetworkConfig
        const networkName = this.config.environment === 'mainnet' ? 'mainnet' : 'testnet';
        this.client = Client.forName(networkName);
        this.client.setOperator(
          AccountId.fromString(this.operatorId), 
          PrivateKey.fromString(this.operatorKey)
        );
        
        // Test the connection with a timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 10000); // 10 second timeout
        });
        
        const balanceQuery = new AccountBalanceQuery()
          .setAccountId(this.operatorId)
          .execute(this.client);
        
        const balance = await Promise.race([balanceQuery, timeoutPromise]);
        
        console.log(`Hedera connection test successful. Account balance: ${(balance as any).hbars.toString()}`);
        this.status = NetworkStatus.CONNECTED;
        return true;
      } catch (testError: any) {
        console.warn('Hedera connection test failed, but continuing in read-only mode:', testError.message);
        // Set status to connected but note that full functionality may not be available
        this.status = NetworkStatus.CONNECTED;
        // Return true to allow read-only operations
        return true;
      }
    } catch (error: any) {
      console.warn('Error initializing Hedera client, continuing in read-only mode:', error.message);
      this.status = NetworkStatus.CONNECTED; // Allow read-only operations
      return true; // Return true to prevent app crashes
    }
  }

  /**
   * Get current network status
   */
  async getStatus(): Promise<NetworkStatus> {
    if (this.status === NetworkStatus.CONNECTED && this.client) {
      try {
        // Do a quick check to ensure connection is still active
        await new AccountBalanceQuery()
          .setAccountId(this.operatorId!)
          .execute(this.client);
      } catch (error) {
        this.status = NetworkStatus.ERROR;
      }
    }
    return this.status;
  }

  /**
   * Deploy a smart contract to Hedera
   */
  async deployContract(params: DeploymentParams): Promise<BlockchainTransactionResult> {
    try {
      if (!this.client) {
        await this.initialize();
        if (!this.client) {
          throw new Error('Hedera client not initialized');
        }
      }
      
      const { bytecode, abi, constructorArgs = [] } = params;
      
      // Setup the contract create transaction
      let contractCreateTx = new ContractCreateFlow()
        .setGas(params.gasLimit || 1000000)
        .setBytecode(bytecode);
      
      // Add constructor parameters if any
      if (constructorArgs.length > 0) {
        // Find constructor definition from ABI
        const constructorDef = abi.find(item => item.type === 'constructor');
        if (constructorDef) {
          // Create parameters object
          let functionParams = new ContractFunctionParameters();
          
          // Add each parameter according to its type
          constructorDef.inputs.forEach((input: any, index: number) => {
            const value = constructorArgs[index];
            
            // This part comes from existing code in deploy/route.ts
            switch (input.type) {
              case 'string':
                functionParams = functionParams.addString(value);
                break;
              case 'address':
                functionParams = functionParams.addAddress(value);
                break;
              case 'bool':
                functionParams = functionParams.addBool(Boolean(value));
                break;
              case 'uint8':
                functionParams = functionParams.addUint8(Number(value));
                break;
              case 'uint16':
                functionParams = functionParams.addUint16(Number(value));
                break;
              case 'uint32':
                functionParams = functionParams.addUint32(Number(value));
                break;
              case 'uint64':
                // Convert BigInt to Long for Hedera SDK
                functionParams = functionParams.addUint64(Long.fromString(value.toString()));
                break;
              case 'uint256':
                // Convert BigInt to string for Hedera SDK
                functionParams = functionParams.addUint256(value.toString());
                break;
              case 'int8':
                functionParams = functionParams.addInt8(Number(value));
                break;
              case 'int16':
                functionParams = functionParams.addInt16(Number(value));
                break;
              case 'int32':
                functionParams = functionParams.addInt32(Number(value));
                break;
              case 'int64':
                // Convert BigInt to Long for Hedera SDK
                functionParams = functionParams.addInt64(Long.fromString(value.toString()));
                break;
              case 'int256':
                // Convert BigInt to string for Hedera SDK
                functionParams = functionParams.addInt256(value.toString());
                break;
              case 'bytes32':
                functionParams = functionParams.addBytes32(value);
                break;
              default:
                if (input.type.includes('[]')) {
                  // Handle array types - only support string arrays and address arrays
                  if (input.type === 'string[]') {
                    functionParams = functionParams.addStringArray(value);
                  } else if (input.type === 'address[]') {
                    functionParams = functionParams.addAddressArray(value);
                  } else {
                    console.warn(`Array type ${input.type} not directly supported. Converting to bytes.`);
                    // Fallback to bytes for unsupported array types
                    const bytesValue = Buffer.from(JSON.stringify(value));
                    functionParams = functionParams.addBytes(bytesValue);
                  }
                } else {
                  console.warn(`Unsupported parameter type: ${input.type}`);
                  // Default to bytes for unknown types
                  functionParams = functionParams.addBytes(Buffer.from(value.toString()));
                }
            }
          });
          
          // Set constructor parameters
          contractCreateTx = contractCreateTx.setConstructorParameters(functionParams._build());
        }
      }
      
      // Execute the contract create transaction
      const contractCreateSubmit = await contractCreateTx.execute(this.client);
      const contractCreateRx = await contractCreateSubmit.getReceipt(this.client);
      
      // Get the new contract ID
      const contractId = contractCreateRx.contractId;
      
      if (!contractId) {
        throw new Error('Failed to get contract ID from receipt');
      }
      
      // Convert contract ID to Solidity address format
      const contractAddress = contractId.toSolidityAddress();
      
      return {
        success: true,
        contractId: contractId.toString(),
        contractAddress: contractAddress,
        transactionId: contractCreateSubmit.transactionId.toString(),
        explorerUrl: this.getExplorerUrl('transaction', contractCreateSubmit.transactionId.toString())
      };
    } catch (error: any) {
      console.error('Error deploying contract:', error);
      
      // Provide a friendly error message based on the error type
      let errorMessage = 'Failed to deploy contract';
      
      if (error instanceof Error) {
        if (error.message.includes('INSUFFICIENT_GAS')) {
          errorMessage = 'Deployment failed due to insufficient gas. Try increasing the gas limit.';
        } else if (error.message.includes('CONTRACT_REVERT_EXECUTED')) {
          errorMessage = 'Contract deployment reverted. Check your constructor logic.';
        } else if (error.message.includes('INSUFFICIENT_ACCOUNT_BALANCE')) {
          errorMessage = 'Insufficient account balance to deploy the contract.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Call a contract function (read or write)
   */
  async callContract(params: ContractCallParams): Promise<BlockchainTransactionResult> {
    try {
      if (!this.client) {
        await this.initialize();
        if (!this.client) {
          throw new Error('Hedera client not initialized');
        }
      }
      
      const { contractAddress, functionName, parameters = [], isQuery, abi } = params;
      
      // Format contract address for Hedera
      const formattedContractId = formatContractId(contractAddress);
      
      if (isQuery) {
        // Read-only call using ContractCallQuery
        const contractCallQuery = new ContractCallQuery()
          .setContractId(formattedContractId)
          .setGas(params.gasLimit || 100000)
          .setFunction(functionName);
        
        // Add function parameters if any
        if (parameters.length > 0 && abi) {
          const functionAbi = abi.find(item => 
            item.type === 'function' && item.name === functionName
          );
          
          if (functionAbi) {
            const functionParams = this.createFunctionParameters(functionAbi.inputs, parameters);
            contractCallQuery.setFunctionParameters(functionParams._build());
          }
        }
        
        // Execute the query
        const result = await contractCallQuery.execute(this.client);
        
        // Process the result (ContractFunctionResult object)
        const outputData = result.asBytes();
        
        return {
          success: true,
          transactionId: 'query', // No transaction ID for queries
          outputData: outputData
        };
      } else {
        // State-changing call using ContractExecuteTransaction
        const contractExecTx = new ContractExecuteTransaction()
          .setContractId(formattedContractId)
          .setGas(params.gasLimit || 300000)
          .setFunction(functionName);
        
        // Add function parameters if any
        if (parameters.length > 0 && abi) {
          const functionAbi = abi.find(item => 
            item.type === 'function' && item.name === functionName
          );
          
          if (functionAbi) {
            const functionParams = this.createFunctionParameters(functionAbi.inputs, parameters);
            contractExecTx.setFunctionParameters(functionParams._build());
          }
        }
        
        // Execute the transaction
        const contractExecSubmit = await contractExecTx.execute(this.client);
        const contractExecRx = await contractExecSubmit.getReceipt(this.client);
        
        return {
          success: true,
          transactionId: contractExecSubmit.transactionId.toString(),
          gasUsed: params.gasLimit, // Approximate, Hedera doesn't return exact gas used
          explorerUrl: this.getExplorerUrl('transaction', contractExecSubmit.transactionId.toString())
        };
      }
    } catch (error: any) {
      console.error('Error calling contract:', error);
      
      let errorMessage = 'Failed to call contract function';
      
      if (error instanceof Error) {
        if (error.message.includes('INSUFFICIENT_GAS')) {
          errorMessage = 'Function call failed due to insufficient gas. Try increasing the gas limit.';
        } else if (error.message.includes('CONTRACT_REVERT_EXECUTED')) {
          errorMessage = 'Function call reverted. Check your function inputs and logic.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Helper to create ContractFunctionParameters from ABI and values
   */
  private createFunctionParameters(
    inputDefinitions: any[], 
    paramValues: any[]
  ): ContractFunctionParameters {
    let functionParams = new ContractFunctionParameters();
    
    inputDefinitions.forEach((input: any, index: number) => {
      const value = paramValues[index];
      
      // Parameter handling adapted from existing code
      switch (input.type) {
        case 'string':
          functionParams = functionParams.addString(value);
          break;
        case 'address':
          functionParams = functionParams.addAddress(value);
          break;
        case 'bool':
          functionParams = functionParams.addBool(Boolean(value));
          break;
        case 'uint8':
          functionParams = functionParams.addUint8(Number(value));
          break;
        case 'uint16':
          functionParams = functionParams.addUint16(Number(value));
          break;
        case 'uint32':
          functionParams = functionParams.addUint32(Number(value));
          break;
        case 'uint64':
          functionParams = functionParams.addUint64(Long.fromString(value.toString()));
          break;
        case 'uint256':
          functionParams = functionParams.addUint256(value.toString());
          break;
        case 'int8':
          functionParams = functionParams.addInt8(Number(value));
          break;
        case 'int16':
          functionParams = functionParams.addInt16(Number(value));
          break;
        case 'int32':
          functionParams = functionParams.addInt32(Number(value));
          break;
        case 'int64':
          functionParams = functionParams.addInt64(Long.fromString(value.toString()));
          break;
        case 'int256':
          functionParams = functionParams.addInt256(value.toString());
          break;
        case 'bytes32':
          functionParams = functionParams.addBytes32(value);
          break;
        default:
          if (input.type.includes('[]')) {
            if (input.type === 'string[]') {
              functionParams = functionParams.addStringArray(value);
            } else if (input.type === 'address[]') {
              functionParams = functionParams.addAddressArray(value);
            } else {
              const bytesValue = Buffer.from(JSON.stringify(value));
              functionParams = functionParams.addBytes(bytesValue);
            }
          } else {
            functionParams = functionParams.addBytes(Buffer.from(value.toString()));
          }
      }
    });
    
    return functionParams;
  }

  /**
   * Get contract bytecode from address
   */
  async getContractBytecode(contractAddress: string): Promise<string> {
    try {
      // Use Mirror Node to get contract info
      const contractInfo = await getContractInfoFromMirrorNode(
        contractAddress, 
        this.config.environment === 'mainnet' ? 'mainnet' : 'testnet'
      );
      
      if (contractInfo && contractInfo.bytecode) {
        return contractInfo.bytecode.startsWith('0x') 
          ? contractInfo.bytecode 
          : `0x${contractInfo.bytecode}`;
      }
      
      throw new Error(`Bytecode not found for contract ${contractAddress}`);
    } catch (error: any) {
      console.error('Error getting contract bytecode:', error);
      throw error;
    }
  }

  /**
   * Get contract ABI from address
   * Note: Hedera doesn't store ABIs on-chain, so this will almost always return null
   */
  async getContractAbi(contractAddress: string): Promise<any[] | null> {
    // Hedera doesn't store ABIs on-chain, so we can't retrieve them directly
    return null;
  }

  /**
   * Format explorer URL for transaction
   */
  getExplorerUrl(type: 'transaction' | 'address' | 'block', hash: string): string {
    const baseUrl = this.config.explorerUrl;
    
    switch (type) {
      case 'transaction':
        return `${baseUrl}/transaction/${hash}`;
      case 'address':
        // For contract addresses, use the contract path
        if (hash.includes('.')) {
          return `${baseUrl}/contract/${hash}`;
        }
        // For EVM addresses
        if (hash.startsWith('0x')) {
          return `${baseUrl}/address/${hash}`;
        }
        // For account IDs
        return `${baseUrl}/account/${hash}`;
      case 'block':
        return `${baseUrl}/block/${hash}`;
      default:
        return baseUrl;
    }
  }

  /**
   * Format address for Hedera network
   */
  formatAddress(address: string): string {
    // If it's already in Hedera format (0.0.X), return as is
    if (address.match(/^\d+\.\d+\.\d+$/)) {
      return address;
    }
    
    // If it's an EVM address, format it
    return formatContractId(address);
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(params: DeploymentParams | ContractCallParams): Promise<number> {
    // Since Hedera doesn't have a direct estimateGas equivalent,
    // we'll use some heuristics based on operation type
    
    if ('bytecode' in params) {
      // This is a deployment
      const deployParams = params as DeploymentParams;
      const bytecodeLength = deployParams.bytecode.length;
      
      // Base gas plus additional gas per byte of bytecode
      const baseGas = 1000000;
      const gasPerByte = 100;
      
      const calculatedGas = baseGas + (bytecodeLength / 2) * gasPerByte;
      
      // Minimum and maximum gas limits
      const minGas = 1000000;
      const maxGas = 15000000;
      
      return Math.min(maxGas, Math.max(minGas, Math.ceil(calculatedGas)));
    } else {
      // This is a contract call
      const callParams = params as ContractCallParams;
      
      if (callParams.isQuery) {
        // Read functions generally use less gas
        return 100000;
      } else {
        // Write functions need more gas
        return 300000;
      }
    }
  }

  /**
   * Get current gas price (not directly applicable to Hedera)
   */
  async getGasPrice(): Promise<string> {
    // Hedera uses a fixed gas price model, returning a placeholder
    return "100000000"; // 0.1 Hbar in tinybars
  }
} 