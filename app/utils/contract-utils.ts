import { ethers } from 'ethers';

// HashIO JSON-RPC endpoint for Hedera testnet
export const HASHIO_API_ENDPOINT = 'https://testnet.hashio.io/api';

// Mirror Node API endpoints
export const MIRROR_NODE_TESTNET = 'https://testnet.mirrornode.hedera.com/api/v1';
export const MIRROR_NODE_MAINNET = 'https://mainnet-public.mirrornode.hedera.com/api/v1';

// Cache for contract ID to EVM address mappings to avoid repeated API calls
export const contractAddressCache = new Map<string, string>();

/**
 * Dynamically fetch the EVM address for a Hedera contract ID using Mirror Node
 * @param contractId Contract ID in Hedera format (0.0.X)
 * @returns Promise with the EVM address with 0x prefix
 */
export async function fetchEvmAddressFromMirrorNode(contractId: string): Promise<string> {
  // Check cache first
  if (contractAddressCache.has(contractId)) {
    console.log(`Using cached EVM address for ${contractId}: ${contractAddressCache.get(contractId)}`);
    return contractAddressCache.get(contractId)!;
  }

  try {
    console.log(`Fetching EVM address for contract ID ${contractId} from Mirror Node`);

    // Define the Mirror Node API URL - default to testnet
    const baseUrl = MIRROR_NODE_TESTNET;

    // Make a direct request to Mirror Node for the contract info
    // No need to remove 0x prefix here since we're querying with contract ID
    const mirrorNodeUrl = `${baseUrl}/contracts/${contractId}`;
    console.log('Mirror Node URL:', mirrorNodeUrl);

    const response = await fetch(mirrorNodeUrl);
    if (!response.ok) {
      throw new Error(`Mirror Node request failed with status: ${response.status}`);
    }

    const data = await response.json();

    // Extract the EVM address from the response
    if (data.evm_address) {
      // Ensure 0x prefix
      const evmAddress = data.evm_address.startsWith('0x')
        ? data.evm_address.toLowerCase()
        : `0x${data.evm_address}`.toLowerCase();

      console.log(`Retrieved EVM address ${evmAddress} for contract ID ${contractId}`);

      // Cache the result
      contractAddressCache.set(contractId, evmAddress);

      // Also cache the reverse mapping
      if (data.contract_id) {
        contractAddressCache.set(evmAddress, data.contract_id);
      }

      return evmAddress;
    } else {
      throw new Error(`No EVM address found for contract ID ${contractId}`);
    }
  } catch (error: any) {
    console.error(`Error fetching EVM address for ${contractId}:`, error.message);
    throw error;
  }
}

/**
 * Converts any contract address format to EVM format
 * Handles both Hedera (0.0.X) and EVM formats
 * Uses async Mirror Node lookup for accurate conversions
 */
export async function formatToEvmAddressAsync(contractAddress: string): Promise<string> {
  try {
    // Log the input for debugging
    console.log('Formatting contract address or ID to EVM format (async):', contractAddress);

    // Handle null or undefined input
    if (!contractAddress) {
      console.warn('Empty contract address provided');
      return '0x0000000000000000000000000000000000000000';
    }

    // If already starts with 0x, ensure it doesn't have double prefix
    if (contractAddress.startsWith('0x')) {
      // Remove any duplicate 0x prefix (like "0x0x...")
      if (contractAddress.startsWith('0x0x')) {
        const formattedAddress = '0x' + contractAddress.substring(4);
        console.log('Removed duplicate 0x prefix:', formattedAddress);
        return formattedAddress;
      }

      // Ensure full EVM address length (0x + 40 chars)
      if (contractAddress.length < 42) {
        const paddedAddress = '0x' + contractAddress.substring(2).padStart(40, '0');
        console.log('Padded short EVM address:', paddedAddress);
        return paddedAddress;
      }

      console.log('Using existing EVM address:', contractAddress);
      return contractAddress;
    }

    // For shard.realm.num format
    if (contractAddress.includes('.')) {
      const parts = contractAddress.split('.');
      // If we have a valid Hedera ID format, use Mirror Node to get the accurate mapping
      if (parts.length === 3) {
        try {
          // Use Mirror Node API to get the correct EVM address
          const evmAddress = await fetchEvmAddressFromMirrorNode(contractAddress);
          console.log('Retrieved EVM address from Mirror Node:', evmAddress);
          return evmAddress;
        } catch (lookupError) {
          // If Mirror Node lookup fails, fall back to our simple conversion
          console.warn('Mirror Node lookup failed, using fallback conversion');
          const formattedAddress = '0x' + parts[2].padStart(40, '0');
          console.log('Fallback conversion of Hedera ID to EVM address:', formattedAddress);
          return formattedAddress;
        }
      }
    }

    // For numeric format without dots (contract ID without shard/realm)
    if (/^\d+$/.test(contractAddress)) {
      try {
        // Try looking up the full ID with shard.realm.num format
        const fullId = `0.0.${contractAddress}`;
        const evmAddress = await fetchEvmAddressFromMirrorNode(fullId);
        console.log('Retrieved EVM address from Mirror Node for numeric ID:', evmAddress);
        return evmAddress;
      } catch (lookupError) {
        // If Mirror Node lookup fails, fall back to our simple conversion
        console.warn('Mirror Node lookup failed for numeric ID, using fallback conversion');
        const formattedAddress = '0x' + contractAddress.padStart(40, '0');
        console.log('Fallback conversion of numeric ID to EVM address:', formattedAddress);
        return formattedAddress;
      }
    }

    // Default: assume it's a valid address without 0x prefix
    const formattedAddress = '0x' + contractAddress;
    console.log('Added 0x prefix to address:', formattedAddress);
    return formattedAddress;
  } catch (error) {
    console.error('Error formatting to EVM address (async):', error);
    // Return as-is with 0x prefix as a fallback
    const fallbackAddress = contractAddress.startsWith('0x') ? contractAddress : '0x' + contractAddress;
    console.log('Using fallback address format (async):', fallbackAddress);
    return fallbackAddress;
  }
}

/**
 * Converts any contract address format to EVM format
 * Handles both Hedera (0.0.X) and EVM formats
 * This is the synchronous version that uses best-effort conversion
 */
export function formatToEvmAddress(contractAddress: string): string {
  try {
    // Log the input for debugging
    console.log('Formatting contract address or ID to EVM format:', contractAddress);

    // Handle null or undefined input
    if (!contractAddress) {
      console.warn('Empty contract address provided');
      return '0x0000000000000000000000000000000000000000';
    }

    // Check if we have a cached mapping for this address
    if (contractAddress.includes('.') && contractAddressCache.has(contractAddress)) {
      const cachedAddress = contractAddressCache.get(contractAddress)!;
      console.log(`Using cached EVM address for ${contractAddress}: ${cachedAddress}`);
      return cachedAddress;
    }

    // If already starts with 0x, ensure it doesn't have double prefix
    if (contractAddress.startsWith('0x')) {
      // Remove any duplicate 0x prefix (like "0x0x...")
      if (contractAddress.startsWith('0x0x')) {
        const formattedAddress = '0x' + contractAddress.substring(4);
        console.log('Removed duplicate 0x prefix:', formattedAddress);
        return formattedAddress;
      }

      // Ensure full EVM address length (0x + 40 chars)
      if (contractAddress.length < 42) {
        const paddedAddress = '0x' + contractAddress.substring(2).padStart(40, '0');
        console.log('Padded short EVM address:', paddedAddress);
        return paddedAddress;
      }

      console.log('Using existing EVM address:', contractAddress);
      return contractAddress;
    }

    // For shard.realm.num format
    if (contractAddress.includes('.')) {
      const parts = contractAddress.split('.');
      // If we have a valid Hedera ID format
      if (parts.length === 3) {
        // Create EVM address with proper padding
        const formattedAddress = '0x' + parts[2].padStart(40, '0');
        console.log('Converted Hedera ID to EVM address:', formattedAddress);

        // Trigger an async lookup for future use, but don't wait for it
        fetchEvmAddressFromMirrorNode(contractAddress)
          .then(actualAddress => {
            if (actualAddress !== formattedAddress) {
              console.log(`Updating cache with correct EVM address for ${contractAddress}: ${actualAddress}`);
              contractAddressCache.set(contractAddress, actualAddress);
            }
          })
          .catch(err => console.warn('Background Mirror Node lookup failed:', err));

        return formattedAddress;
      }
    }

    // For numeric format without dots (contract ID without shard/realm)
    if (/^\d+$/.test(contractAddress)) {
      const formattedAddress = '0x' + contractAddress.padStart(40, '0');
      console.log('Converted numeric ID to EVM address:', formattedAddress);

      // Trigger an async lookup for future use, but don't wait for it
      const fullId = `0.0.${contractAddress}`;
      fetchEvmAddressFromMirrorNode(fullId)
        .then(actualAddress => {
          if (actualAddress !== formattedAddress) {
            console.log(`Updating cache with correct EVM address for ${fullId}: ${actualAddress}`);
            contractAddressCache.set(fullId, actualAddress);
          }
        })
        .catch(err => console.warn('Background Mirror Node lookup failed:', err));

      return formattedAddress;
    }

    // Default: assume it's a valid address without 0x prefix
    const formattedAddress = '0x' + contractAddress;
    console.log('Added 0x prefix to address:', formattedAddress);
    return formattedAddress;
  } catch (error) {
    console.error('Error formatting to EVM address:', error);
    // Return as-is with 0x prefix as a fallback
    const fallbackAddress = contractAddress.startsWith('0x') ? contractAddress : '0x' + contractAddress;
    console.log('Using fallback address format:', fallbackAddress);
    return fallbackAddress;
  }
}

/**
 * Get contract information from the Hedera Mirror Node API
 */
export async function getContractInfoFromMirrorNode(
  contractAddress: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): Promise<any> {
  try {
    // Remove 0x prefix if present
    const address = contractAddress.replace(/^0x/, '');

    const baseUrl = network === 'testnet' ? MIRROR_NODE_TESTNET : MIRROR_NODE_MAINNET;
    const mirrorNodeUrl = `${baseUrl}/contracts/${address}`;
    console.log('Fetching contract info from mirror node:', mirrorNodeUrl);

    const response = await fetch(mirrorNodeUrl);
    if (!response.ok) {
      throw new Error(`Mirror node request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.warn('Error getting contract info from mirror node:', error.message);
    throw error;
  }
}

/**
 * Execute a JSON-RPC call to the HashIO API
 * With improved error handling for contract reverts
 */
export async function executeJsonRpcCall(method: string, params: any[]): Promise<any> {
  const requestId = crypto.randomUUID().substring(0, 8);

  const jsonRpcPayload = {
    jsonrpc: '2.0',
    id: requestId,
    method,
    params
  };

  try {
    const response = await fetch(HASHIO_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://karibu.app',
      },
      body: JSON.stringify(jsonRpcPayload),
    });

    if (!response.ok) {
      throw new Error(`JSON-RPC request failed with status: ${response.status}`);
    }

    const responseData = await response.json();

    if (responseData.error) {
      // Check for common contract revert errors
      const errorMessage = responseData.error.message || 'JSON-RPC error';

      // Enhanced error handling for contract reverts
      if (errorMessage.includes('revert') || errorMessage.includes('REVERT')) {
        // Extract the revert reason if available
        let revertReason = 'Contract execution reverted';

        // Try to extract custom revert message from different error formats
        const revertMatch = errorMessage.match(/reverted:?\s*(.*?)($|\s\()/i);
        if (revertMatch && revertMatch[1]) {
          revertReason = `Contract reverted: ${revertMatch[1].trim()}`;
        }

        // Create an error with a cleaner message that includes the request ID
        const error = new Error(`[Request ID: ${requestId}] ${revertReason}`);

        // Add extra information to the error object
        Object.assign(error, {
          code: 'CONTRACT_REVERT',
          originalError: responseData.error,
          revertReason: revertReason,
          requestId: requestId
        });

        throw error;
      }

      // For other errors, still include the request ID for better debugging
      throw new Error(`[Request ID: ${requestId}] ${errorMessage}`);
    }

    return responseData.result;
  } catch (error: any) {
    // If it's already a handled error, just rethrow it
    if (error.code === 'CONTRACT_REVERT') {
      throw error;
    }

    // Otherwise add request ID to any error
    console.error(`Error in JSON-RPC ${method} call [${requestId}]:`, error);
    const enhancedError = new Error(`[Request ID: ${requestId}] ${error.message}`);

    // Preserve stack trace and additional properties
    enhancedError.stack = error.stack;
    throw enhancedError;
  }
}

/**
 * Get contract bytecode using eth_getCode
 */
export async function getContractBytecode(contractAddress: string): Promise<string> {
  // Try to use Moralis service first
  try {
    const { MoralisContractService } = await import('./moralis-contract-service');
    const moralisService = MoralisContractService.getInstance();
    const contractInfo = await moralisService.getContractInfo(contractAddress, 1); // Default to Ethereum mainnet
    
    if (contractInfo.bytecode && contractInfo.bytecode !== '0x') {
      return contractInfo.bytecode;
    }
  } catch (error) {
    console.warn('Moralis service not available, falling back to network adapter:', error);
  }

  // Fallback to network adapter
  try {
    const { networkService } = await import('./networks/network-service');
    if (networkService.isInitialized()) {
      const adapter = networkService.getAdapter();
      if (adapter) {
        return await adapter.getContractBytecode(contractAddress);
      }
    }
  } catch (error) {
    console.warn('Network service not available, falling back to direct RPC call:', error);
  }

  // Final fallback to direct RPC call
  const evmAddress = formatToEvmAddress(contractAddress);
  return executeJsonRpcCall('eth_getCode', [evmAddress, 'latest']);
}

/**
 * Encode function call with parameters
 */
export function encodeFunctionCall(functionName: string, parameters: any[] = []): string {
  try {
    // Simple cases without parameters
    if (!parameters.length) {
      return ethers.utils.id(functionName + '()').slice(0, 10);
    }

    // For functions with parameters, we need to encode them properly
    // This is a simplified version and might need more sophisticated handling
    // for complex parameter types

    // Extract the function name and parameter types
    const match = functionName.match(/^([^(]+)\(([^)]*)\)$/);
    if (match) {
      const name = match[1];
      const paramTypes = match[2].split(',').filter(p => p);

      if (paramTypes.length !== parameters.length) {
        throw new Error('Parameter count mismatch');
      }

      // Create an interface with this function
      const iface = new ethers.utils.Interface([`function ${name}(${paramTypes.join(',')}) returns ()`]);
      return iface.encodeFunctionData(name, parameters);
    }

    // Simple fallback with just the function name and assumption
    // that parameters are primitives
    const signature = `${functionName}(${parameters.map(() => 'uint256').join(',')})`;
    return ethers.utils.id(signature).slice(0, 10);
  } catch (error: any) {
    console.error('Error encoding function call:', error);
    // Fallback to a simple selector
    return ethers.utils.id(functionName + '()').slice(0, 10);
  }
}

/**
 * Common function signatures for standard contracts (ERC20, ERC721, etc.)
 */
export const FUNCTION_SIGNATURES: Record<string, {
  name: string,
  stateMutability: string,
  inputs: any[],
  outputs: any[]
}> = {
  // ERC20
  '0x06fdde03': { name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  '0x95d89b41': { name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  '0x313ce567': { name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  '0x18160ddd': { name: 'totalSupply', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  '0x70a08231': { name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  '0xa9059cbb': { name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  '0xdd62ed3e': { name: 'allowance', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  '0x095ea7b3': { name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
  '0x23b872dd': { name: 'transferFrom', stateMutability: 'nonpayable', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },

  // ERC721
  '0x6352211e': { name: 'ownerOf', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }] },
  '0xc87b56dd': { name: 'tokenURI', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'string' }] },
  '0x42842e0e': { name: 'safeTransferFrom', stateMutability: 'nonpayable', inputs: [{ name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }], outputs: [] },
};

/**
 * Format and process output results based on ABI output types
 */
export function formatOutputResult(result: any, outputs: any[]): any {
  if (!result || !outputs || outputs.length === 0) {
    return result;
  }

  try {
    // For a single output parameter
    if (outputs.length === 1) {
      return result;
    }

    // For multiple output parameters (tuple)
    if (Array.isArray(result)) {
      // Create a named object if we have names for the outputs
      const namedOutputs = outputs.every(output => output.name);
      if (namedOutputs) {
        return outputs.reduce((obj, output, index) => {
          obj[output.name] = result[index];
          return obj;
        }, {});
      }
      // Otherwise return as array
      return result;
    }

    return result;
  } catch (error) {
    console.warn('Error formatting output result:', error);
    return result;
  }
}

/**
 * Converts between Hedera ID format and EVM address format
 * Useful for debugging address format issues
 * @param address Either a Hedera ID (0.0.X) or EVM address (0x...)
 * @returns Object containing both formats
 */
export function addressFormatDebugInfo(address: string): {
  originalInput: string;
  evmFormat: string;
  hederaIdFormat: string | null;
  isValidEvm: boolean;
  conversionMethod: string;
} {
  const result = {
    originalInput: address,
    evmFormat: '',
    hederaIdFormat: null as string | null,
    isValidEvm: false,
    conversionMethod: ''
  };

  try {
    // First convert to EVM format
    result.evmFormat = formatToEvmAddress(address);

    // Check if it's a valid EVM address
    result.isValidEvm = /^0x[0-9a-fA-F]{40}$/.test(result.evmFormat);

    // Try to determine Hedera ID format if possible
    if (result.isValidEvm) {
      const numericPart = result.evmFormat.substring(2).replace(/^0+/, '');
      if (numericPart.length > 0) {
        // This is an approximate conversion - assumes shard.realm is 0.0
        // Would need to check mirror node for exact mapping
        result.hederaIdFormat = `0.0.${parseInt(numericPart, 16)}`;
        result.conversionMethod = 'Converted from EVM address';
      }
    }

    // If we started with a Hedera ID format
    if (address.includes('.')) {
      const parts = address.split('.');
      if (parts.length === 3) {
        result.hederaIdFormat = address;
        result.conversionMethod = 'Original input was Hedera ID';
      }
    }

    return result;
  } catch (error) {
    console.error('Error in addressFormatDebugInfo:', error);
    result.conversionMethod = 'Error during conversion';
    result.evmFormat = address.startsWith('0x') ? address : '0x' + address;
    return result;
  }
}

/**
 * Format a contract address specifically for Mirror Node API (synchronous version)
 * This is different from EVM address formatting
 * @param address Contract address in any format
 * @returns Properly formatted address for Mirror Node API
 */
export function formatAddressForMirrorNode(address: string): string {
  // For Hedera contract ID format (0.0.X)
  if (/^\d+\.\d+\.\d+$/.test(address)) {
    // Check cache first
    if (contractAddressCache.has(address)) {
      const cachedEvmAddress = contractAddressCache.get(address)!;
      const formattedAddress = cachedEvmAddress.startsWith('0x') ? cachedEvmAddress.slice(2) : cachedEvmAddress;
      console.log(`Using cached address for Mirror Node API: ${formattedAddress} (from ${address})`);
      return formattedAddress;
    }

    // If no cached address, convert the numeric part to hex
    const parts = address.split('.');
    const contractNum = parseInt(parts[2], 10);

    // Convert to hex and pad to 40 characters
    const hexValue = contractNum.toString(16).padStart(40, '0');
    console.log(`Formatted address for Mirror Node API: ${hexValue} (from ${address})`);

    // Trigger an async lookup for future use, but don't wait for it
    fetchEvmAddressFromMirrorNode(address)
      .then(evmAddress => {
        const correctFormat = evmAddress.startsWith('0x') ? evmAddress.slice(2) : evmAddress;
        if (correctFormat !== hexValue) {
          console.log(`Updating cache with correct Mirror Node format for ${address}: ${correctFormat}`);
          contractAddressCache.set(address, evmAddress); // Store with 0x for other uses
        }
      })
      .catch(err => console.warn('Background Mirror Node lookup failed:', err));

    return hexValue;
  }

  // If it's already an EVM address (with or without 0x prefix)
  if (/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
    // Remove 0x prefix if present, Mirror Node doesn't want it
    const formattedAddress = address.startsWith('0x') ? address.slice(2) : address;
    console.log(`Formatted address for Mirror Node API: ${formattedAddress} (from ${address})`);
    return formattedAddress;
  }

  // For numeric format without dots (contract ID without shard/realm)
  if (/^\d+$/.test(address)) {
    // Check if we have a cached address for the full ID
    const fullId = `0.0.${address}`;
    if (contractAddressCache.has(fullId)) {
      const cachedEvmAddress = contractAddressCache.get(fullId)!;
      const formattedAddress = cachedEvmAddress.startsWith('0x') ? cachedEvmAddress.slice(2) : cachedEvmAddress;
      console.log(`Using cached address for Mirror Node API: ${formattedAddress} (from ${address})`);
      return formattedAddress;
    }

    // Convert to hex and pad to 40 characters
    const numValue = parseInt(address, 10);
    const hexValue = numValue.toString(16).padStart(40, '0');
    console.log(`Formatted address for Mirror Node API: ${hexValue} (from ${address})`);

    // Trigger an async lookup for future use, but don't wait for it
    fetchEvmAddressFromMirrorNode(fullId)
      .then(evmAddress => {
        const correctFormat = evmAddress.startsWith('0x') ? evmAddress.slice(2) : evmAddress;
        if (correctFormat !== hexValue) {
          console.log(`Updating cache with correct Mirror Node format for ${fullId}: ${correctFormat}`);
          contractAddressCache.set(fullId, evmAddress); // Store with 0x for other uses
        }
      })
      .catch(err => console.warn('Background Mirror Node lookup failed:', err));

    return hexValue;
  }

  // If we can't determine the format, return as is without 0x prefix
  const formattedAddress = address.startsWith('0x') ? address.slice(2) : address;
  console.log(`Formatted address for Mirror Node API: ${formattedAddress} (from ${address})`);
  return formattedAddress;
}

/**
 * Format a contract address specifically for Mirror Node API
 * This is different from EVM address formatting
 * @param address Contract address in any format
 * @returns Properly formatted address for Mirror Node API
 */
export async function formatAddressForMirrorNodeAsync(address: string): Promise<string> {
  console.log(`Async formatted address for Mirror Node API: ${address}`);

  // For Hedera contract ID format (0.0.X)
  if (/^\d+\.\d+\.\d+$/.test(address)) {
    try {
      // First convert to EVM address using the async function that calls Mirror Node
      const evmAddress = await fetchEvmAddressFromMirrorNode(address);

      // Remove 0x prefix for Mirror Node API
      const formattedAddress = evmAddress.startsWith('0x') ? evmAddress.slice(2) : evmAddress;
      console.log(`Async formatted address for Mirror Node API: ${formattedAddress} (from ${address})`);
      return formattedAddress;
    } catch (error) {
      console.error(`Error converting Hedera ID to EVM format: ${error}`);

      // Fallback to simple conversion for the API
      // Get the contract ID number (the third part)
      const parts = address.split('.');
      const contractNum = parseInt(parts[2], 10);

      // Convert to hex and pad to 40 characters
      const hexValue = contractNum.toString(16).padStart(40, '0');
      console.log(`Fallback Hedera ID formatting: ${hexValue} (from ${address})`);
      return hexValue;
    }
  }

  // If it's already an EVM address (with or without 0x prefix)
  if (/^(0x)?[0-9a-fA-F]{40}$/.test(address)) {
    // Remove 0x prefix if present, Mirror Node doesn't want it
    const formattedAddress = address.startsWith('0x') ? address.slice(2) : address;
    console.log(`Async formatted address for Mirror Node API: ${formattedAddress} (from ${address})`);
    return formattedAddress;
  }

  // For numeric format without dots (contract ID without shard/realm)
  if (/^\d+$/.test(address)) {
    try {
      // Try looking up the full ID with shard.realm.num format
      const fullId = `0.0.${address}`;
      const evmAddress = await fetchEvmAddressFromMirrorNode(fullId);

      // Remove 0x prefix for Mirror Node API
      const formattedAddress = evmAddress.startsWith('0x') ? evmAddress.slice(2) : evmAddress;
      console.log(`Async formatted address for Mirror Node API: ${formattedAddress} (from ${address})`);
      return formattedAddress;
    } catch (error) {
      console.error(`Error converting numeric ID to EVM format: ${error}`);

      // Fallback to simple conversion
      const numValue = parseInt(address, 10);
      const hexValue = numValue.toString(16).padStart(40, '0');
      console.log(`Fallback numeric ID formatting: ${hexValue} (from ${address})`);
      return hexValue;
    }
  }

  // If we can't determine the format, return as is without 0x prefix
  const formattedAddress = address.startsWith('0x') ? address.slice(2) : address;
  console.log(`Async formatted address for Mirror Node API: ${formattedAddress} (from ${address})`);
  return formattedAddress;
}