import { NextRequest, NextResponse } from 'next/server';
import { networkService } from '@/app/utils/networks/network-service';

/**
 * API route handler for fetching contract ABI with multiple fallback strategies
 * Combines Moralis service with blockchain explorer APIs for maximum reliability
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      contractAddress,
      networkId,
      forceRefresh = false,
      preferSource = true,
      bypassCache = false,
      analysisMethod = 'comprehensive'
    } = await request.json();

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address is required' }, 
        { status: 400 }
      );
    }

    console.log(`Fetching ABI for contract ${contractAddress} on network ${networkId}`);

    // Initialize network service if not already initialized
    if (!networkService.isInitialized()) {
      await networkService.initialize();
    }

    // Switch to the specified network if provided
    if (networkId) {
      const switchSuccess = await networkService.changeNetwork(networkId);
      if (!switchSuccess) {
        console.warn(`Failed to switch to network ${networkId}, using active adapter`);
      }
    }

    const adapter = networkService.getAdapter();
    if (!adapter) {
      return NextResponse.json(
        { error: 'No blockchain network adapter available' },
        { status: 500 }
      );
    }

    let abi: any[] = [];
    let source = 'unknown';
    let isVerified = false;
    let additionalInfo: any = {};

    // Strategy 1: Try Moralis service first (most comprehensive)
    try {
      console.log('Attempting to fetch ABI via Moralis service...');
      const { MoralisContractService } = await import('@/app/utils/moralis-contract-service');
      
      const moralisService = MoralisContractService.getInstance();
      const chainId = adapter.getConfig().chainId || 1;
      
      if (moralisService.isChainSupported(chainId)) {
        const contractInfo = await moralisService.getContractInfo(contractAddress, chainId);
        
        if (contractInfo.abi && contractInfo.abi.length > 0) {
          abi = contractInfo.abi;
          source = 'moralis';
          isVerified = contractInfo.isVerified;
          additionalInfo = {
            name: contractInfo.name,
            symbol: contractInfo.symbol,
            contractType: contractInfo.contractType,
            isVerified: contractInfo.isVerified,
            totalSupply: contractInfo.totalSupply,
            decimals: contractInfo.decimals
          };
          
          console.log(`✅ Successfully fetched ABI via Moralis (${abi.length} functions)`);
        }
      } else {
        console.warn(`Chain ${chainId} not supported by Moralis`);
      }
    } catch (moralisError) {
      console.warn('Moralis service failed, trying fallback methods:', moralisError);
    }

    // Strategy 2: Try network adapter's built-in ABI fetching
    if (abi.length === 0) {
      try {
        console.log('Attempting to fetch ABI via network adapter...');
        const adapterAbi = await adapter.getContractAbi(contractAddress);
        
        if (adapterAbi && adapterAbi.length > 0) {
          abi = adapterAbi;
          source = 'network_adapter';
          isVerified = true;
          
          console.log(`✅ Successfully fetched ABI via network adapter (${abi.length} functions)`);
        }
      } catch (adapterError) {
        console.warn('Network adapter ABI fetch failed:', adapterError);
      }
    }

    // Strategy 3: Try blockchain explorer APIs (Etherscan-like)
    if (abi.length === 0) {
      try {
        console.log('Attempting to fetch ABI via blockchain explorer...');
        const explorerAbi = await fetchFromBlockchainExplorer(contractAddress, adapter);
        
        if (explorerAbi && explorerAbi.length > 0) {
          abi = explorerAbi.abi || explorerAbi;
          source = 'blockchain_explorer';
          isVerified = explorerAbi.isVerified || true;
          additionalInfo = explorerAbi.additionalInfo || {};
          
          console.log(`✅ Successfully fetched ABI via blockchain explorer (${abi.length} functions)`);
        }
      } catch (explorerError) {
        console.warn('Blockchain explorer ABI fetch failed:', explorerError);
      }
    }

    // Strategy 4: Bytecode analysis and function signature detection
    if (abi.length === 0 && analysisMethod === 'comprehensive') {
      try {
        console.log('Attempting to detect functions from bytecode...');
        const detectedFunctions = await detectFunctionsFromBytecode(contractAddress, adapter);
        
        if (detectedFunctions && detectedFunctions.length > 0) {
          abi = detectedFunctions;
          source = 'bytecode_analysis';
          isVerified = false;
          additionalInfo.note = 'Functions detected from bytecode analysis. Results may be incomplete.';
          
          console.log(`✅ Detected ${abi.length} functions from bytecode analysis`);
        }
      } catch (bytecodeError) {
        console.warn('Bytecode analysis failed:', bytecodeError);
      }
    }

    // Return results
    if (abi.length === 0) {
      return NextResponse.json(
        { 
          error: 'No ABI found for this contract. The contract might not be verified or deployed.',
          contractAddress,
          networkId: adapter.getConfig().id,
          networkName: adapter.getConfig().name,
          strategies_attempted: ['moralis', 'network_adapter', 'blockchain_explorer', 'bytecode_analysis']
        },
        { status: 404 }
      );
    }

    // Enhance ABI with additional metadata
    const enhancedAbi = enhanceAbiWithMetadata(abi, additionalInfo);

    return NextResponse.json({
      abi: enhancedAbi,
      source,
      isVerified,
      contractAddress,
      networkId: adapter.getConfig().id,
      networkName: adapter.getConfig().name,
      functionCount: enhancedAbi.filter(item => item.type === 'function').length,
      eventCount: enhancedAbi.filter(item => item.type === 'event').length,
      additionalInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error fetching contract ABI:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch contract ABI',
        details: error.stack && process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch ABI from blockchain explorer APIs (Etherscan-like)
 */
async function fetchFromBlockchainExplorer(contractAddress: string, adapter: any): Promise<any> {
  const networkConfig = adapter.getConfig();
  
  // For Ethereum networks, try Etherscan API
  if (networkConfig.type === 'ethereum' || networkConfig.chainId === 1 || networkConfig.chainId === 11155111) {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    if (!apiKey) {
      throw new Error('Etherscan API key not configured');
    }

    const baseUrl = networkConfig.chainId === 1 
      ? 'https://api.etherscan.io/api'
      : 'https://api-sepolia.etherscan.io/api';

    const response = await fetch(`${baseUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`);
    
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === '1' && data.result) {
      const abi = JSON.parse(data.result);
      return {
        abi,
        isVerified: true,
        additionalInfo: {
          source: 'etherscan',
          verified: true
        }
      };
    }
    
    throw new Error(data.result || 'Contract not verified on Etherscan');
  }

  // For other networks, could add more explorer APIs
  throw new Error(`No blockchain explorer API available for network ${networkConfig.name}`);
}

/**
 * Detect function signatures from contract bytecode
 */
async function detectFunctionsFromBytecode(contractAddress: string, adapter: any): Promise<any[]> {
  try {
    // Get contract bytecode
    const bytecode = await adapter.getContractBytecode(contractAddress);
    
    if (!bytecode || bytecode === '0x') {
      throw new Error('No bytecode found');
    }

    // Extract function selectors (4-byte function signatures)
    const selectorRegex = /63([0-9a-f]{8})/gi;
    const selectors = new Set<string>();
    let match;
    
    while ((match = selectorRegex.exec(bytecode)) !== null) {
      selectors.add('0x' + match[1]);
    }

    if (selectors.size === 0) {
      throw new Error('No function selectors found in bytecode');
    }

    console.log(`Found ${selectors.size} potential function selectors`);

    // Resolve selectors to function signatures using 4byte.directory
    const resolvedFunctions: any[] = [];
    
    for (const selector of Array.from(selectors).slice(0, 20)) { // Limit to prevent excessive API calls
      try {
        const response = await fetch(`https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.results && data.results.length > 0) {
            // Get the most likely signature
            const signature = data.results[0].text_signature;
            const parsedFunction = parseSignatureToAbi(signature, selector);
            
            if (parsedFunction) {
              resolvedFunctions.push(parsedFunction);
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to resolve selector ${selector}:`, error);
      }
    }

    return resolvedFunctions;
  } catch (error) {
    console.error('Error detecting functions from bytecode:', error);
    return [];
  }
}

/**
 * Parse function signature to ABI format
 */
function parseSignatureToAbi(signature: string, selector: string): any {
  try {
    // Parse signature like "transfer(address,uint256)"
    const funcNameMatch = signature.match(/^([^(]+)\(/);
    const funcName = funcNameMatch ? funcNameMatch[1] : 'unknown';
    
    // Parse parameters
    const paramsMatch = signature.match(/\((.*)\)/);
    const paramsStr = paramsMatch ? paramsMatch[1] : '';
    
    const inputs = paramsStr.split(',').filter(Boolean).map((param, i) => {
      const trimmed = param.trim();
      const type = trimmed || 'bytes32';
      return { 
        type, 
        name: `param${i}`,
        internalType: type
      };
    });

    return {
      type: 'function',
      name: funcName,
      inputs,
      outputs: [],
      stateMutability: 'nonpayable', // Default assumption
      signature,
      selector,
      detected: true
    };
  } catch (error) {
    console.warn(`Failed to parse signature ${signature}:`, error);
    return null;
  }
}

/**
 * Enhance ABI with additional metadata and standardization
 */
function enhanceAbiWithMetadata(abi: any[], additionalInfo: any): any[] {
  return abi.map(item => {
    // Ensure all required fields are present
    const enhanced = {
      ...item,
      type: item.type || 'function',
      name: item.name || 'unknown',
      inputs: item.inputs || [],
      outputs: item.outputs || []
    };

    // Add stateMutability if missing
    if (enhanced.type === 'function' && !enhanced.stateMutability) {
      // Try to infer from function name and inputs
      if (enhanced.name.startsWith('get') || enhanced.name.startsWith('view') || enhanced.name.includes('Balance')) {
        enhanced.stateMutability = 'view';
      } else {
        enhanced.stateMutability = 'nonpayable';
      }
    }

    // Add human-readable descriptions for common functions
    if (enhanced.type === 'function') {
      enhanced.description = generateFunctionDescription(enhanced);
    }

    return enhanced;
  });
}

/**
 * Generate human-readable descriptions for functions
 */
function generateFunctionDescription(func: any): string {
  const name = func.name;
  const isView = func.stateMutability === 'view' || func.stateMutability === 'pure';
  
  // Common function patterns
  if (name === 'balanceOf') return 'Get the token balance of an address';
  if (name === 'transfer') return 'Transfer tokens to another address';
  if (name === 'approve') return 'Approve another address to spend tokens';
  if (name === 'totalSupply') return 'Get the total token supply';
  if (name === 'owner') return 'Get the contract owner address';
  if (name === 'pause') return 'Pause contract operations';
  if (name === 'unpause') return 'Resume contract operations';
  if (name.startsWith('get')) return `Get ${name.substring(3).toLowerCase()} information`;
  if (name.startsWith('set') && !isView) return `Set ${name.substring(3).toLowerCase()} value`;
  if (name.startsWith('is')) return `Check if ${name.substring(2).toLowerCase()} condition is true`;
  if (name.startsWith('has')) return `Check if ${name.substring(3).toLowerCase()} exists`;
  
  return isView ? `View function: ${name}` : `Execute function: ${name}`;
} 