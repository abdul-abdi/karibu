import { ContractFunction } from "../types/contract";

/**
 * Analyze a contract and return detailed information about its security and functionality
 */
export const analyzeContract = async (contractAddress: string, abi: ContractFunction[]) => {
  try {
    const response = await fetch('/api/analyze-contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractAddress,
        abi,
        includeDetectedFunctions: true,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze contract');
    }
    
    return await response.json();
  } catch (err: any) {
    console.error('Error analyzing contract:', err);
    throw new Error(err.message || 'An error occurred while analyzing the contract');
  }
};

/**
 * Verify if a function exists in a contract
 */
export const verifyFunction = async (
  contractAddress: string, 
  functionName: string, 
  inputTypes: string[],
  networkId?: string
) => {
  try {
    const response = await fetch('/api/verify-function', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractAddress,
        functionName,
        inputTypes,
        networkId
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { exists: false, error: error.message };
    }

    return await response.json();
  } catch (error: any) {
    console.error('Function verification error:', error);
    return { exists: false, error: error.message };
  }
};

/**
 * Fetch contract ABI from a contract address
 * @param contractAddress The contract address
 * @param options Configuration options for ABI fetching
 * @returns The ABI array or throws an error
 */
export const fetchContractAbi = async (contractAddress: string, options: {
  forceRefresh?: boolean;
  preferSource?: boolean;
  analysisMethod?: string;
  bypassCache?: boolean;
  networkId?: string;
} = {}): Promise<ContractFunction[]> => {
  try {
    // Use Moralis service for better reliability and coverage
    const { MoralisContractService } = await import('./moralis-contract-service');
    
    const moralisService = MoralisContractService.getInstance();
    const contractInfo = await moralisService.getContractInfo(
      contractAddress,
      parseInt(options.networkId || '1')
    );
    
    // Return the ABI in the expected format
    return contractInfo.abi || [];
  } catch (error: any) {
    console.error('Error fetching contract ABI via Moralis service:', error);
    
    // Fallback to the original API endpoint if the new service fails
    try {
      console.log('Falling back to original API endpoint...');
      
      const timestamp = Date.now() + Math.random().toString(36).substring(2);
      
      const response = await fetch('/api/get-contract-abi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress,
          cacheBuster: timestamp,
          forceRefresh: options.forceRefresh || true,
          preferSource: options.preferSource || true,
          analysisMethod: options.analysisMethod || 'bytecode',
          bypassCache: options.bypassCache || true,
          regenerateAbi: true,
          networkId: options.networkId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch ABI: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Return the ABI array directly
      return result.abi || result || [];
    } catch (fallbackError: any) {
      console.error('Fallback API also failed:', fallbackError);
      throw new Error(`Failed to fetch contract ABI: ${error.message}`);
    }
  }
};

/**
 * Verify contract ABI functions against bytecode
 */
export const verifyAbi = async (contractAddress: string, abi: ContractFunction[], networkId?: string) => {
  try {
    const response = await fetch('/api/verify-abi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contractAddress,
        abi,
        networkId
      }),
    });

    if (!response.ok) {
      return { verified: false, functions: abi };
    }

    return await response.json();
  } catch (error) {
    console.error('Error verifying ABI:', error);
    return { verified: false, functions: abi };
  }
}; 