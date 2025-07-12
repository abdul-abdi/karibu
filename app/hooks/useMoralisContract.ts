/**
 * Custom hooks for Moralis contract data fetching
 * Enhanced with NFT, wallet, and DeFi functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { 
  MoralisContractService, 
  ContractData, 
  TransactionData, 
  NFTData, 
  WalletData, 
  TokenBalance, 
  TokenPrice 
} from '../utils/moralis-contract-service';

interface UseContractResult {
  data: ContractData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseTransactionResult {
  data: TransactionData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseNFTResult {
  data: NFTData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseWalletResult {
  data: WalletData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseTokenPriceResult {
  data: TokenPrice | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseTokenBalancesResult {
  data: TokenBalance[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseNFTCollectionResult {
  data: NFTData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch contract information using Moralis
 */
export function useMoralisContract(
  address: string,
  chainId?: number,
  onSuccess?: (data: ContractData) => void,
  onError?: (error: string) => void
): UseContractResult {
  const currentChainId = useChainId();
  const effectiveChainId = chainId || currentChainId;
  
  const [data, setData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const moralisService = MoralisContractService.getInstance();
  
  const fetchData = useCallback(async () => {
    // Don't run on server side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (!address || !isAddress(address) || !effectiveChainId) {
      setData(null);
      setError(null);
      return;
    }
    
    if (!moralisService.isChainSupported(effectiveChainId)) {
      setError(`Chain ${effectiveChainId} is not supported by Moralis`);
      setData(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await moralisService.getContractInfo(address, effectiveChainId);
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contract data';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [address, effectiveChainId, moralisService, onSuccess, onError]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

/**
 * Hook to fetch multiple contracts using Moralis
 */
export function useMoralisContracts(
  addresses: string[],
  chainId?: number,
  onSuccess?: (data: ContractData[]) => void,
  onError?: (error: string) => void
): {
  data: ContractData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const currentChainId = useChainId();
  const effectiveChainId = chainId || currentChainId;
  
  const [data, setData] = useState<ContractData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const moralisService = MoralisContractService.getInstance();
  
  const fetchData = useCallback(async () => {
    if (!addresses.length || !effectiveChainId) {
      setData([]);
      setError(null);
      return;
    }
    
    const validAddresses = addresses.filter(address => isAddress(address));
    if (validAddresses.length === 0) {
      setError('No valid addresses provided');
      setData([]);
      return;
    }
    
    if (!moralisService.isChainSupported(effectiveChainId)) {
      setError(`Chain ${effectiveChainId} is not supported by Moralis`);
      setData([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const results = await Promise.allSettled(
        validAddresses.map(address => 
          moralisService.getContractInfo(address, effectiveChainId)
        )
      );
      
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<ContractData> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);
      
      setData(successfulResults);
      onSuccess?.(successfulResults);
      
      // If some failed, log the errors
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.warn(`${failures.length} contracts failed to load`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contract data';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [addresses, effectiveChainId, moralisService, onSuccess, onError]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

/**
 * Hook to fetch transaction details using Moralis
 */
export function useMoralisTransaction(
  txHash: string,
  chainId?: number,
  onSuccess?: (data: TransactionData) => void,
  onError?: (error: string) => void
): UseTransactionResult {
  const currentChainId = useChainId();
  const effectiveChainId = chainId || currentChainId;
  
  const [data, setData] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const moralisService = MoralisContractService.getInstance();
  
  const fetchData = useCallback(async () => {
    if (!txHash || !effectiveChainId) {
      setData(null);
      setError(null);
      return;
    }
    
    if (!moralisService.isChainSupported(effectiveChainId)) {
      setError(`Chain ${effectiveChainId} is not supported by Moralis`);
      setData(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await moralisService.getTransactionDetails(txHash, effectiveChainId);
      if (result) {
        setData(result);
        onSuccess?.(result);
      } else {
        setError('Transaction not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transaction data';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [txHash, effectiveChainId, moralisService, onSuccess, onError]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

/**
 * Hook to fetch NFT metadata using Moralis
 */
export function useMoralisNFT(
  contractAddress: string,
  tokenId: string,
  chainId?: number,
  onSuccess?: (data: NFTData) => void,
  onError?: (error: string) => void
): UseNFTResult {
  const currentChainId = useChainId();
  const effectiveChainId = chainId || currentChainId;
  
  const [data, setData] = useState<NFTData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const moralisService = MoralisContractService.getInstance();
  
  const fetchData = useCallback(async () => {
    if (!contractAddress || !tokenId || !isAddress(contractAddress) || !effectiveChainId) {
      setData(null);
      setError(null);
      return;
    }
    
    if (!moralisService.isChainSupported(effectiveChainId)) {
      setError(`Chain ${effectiveChainId} is not supported by Moralis`);
      setData(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await moralisService.getNFTMetadata(contractAddress, tokenId, effectiveChainId);
      if (result) {
        setData(result);
        onSuccess?.(result);
      } else {
        setError('NFT not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch NFT data';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [contractAddress, tokenId, effectiveChainId, moralisService, onSuccess, onError]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

/**
 * Hook to fetch wallet data using Moralis
 */
export function useMoralisWallet(
  walletAddress?: string,
  chainId?: number,
  onSuccess?: (data: WalletData) => void,
  onError?: (error: string) => void
): UseWalletResult {
  const { address: connectedAddress } = useAccount();
  const currentChainId = useChainId();
  
  const effectiveAddress = walletAddress || connectedAddress;
  const effectiveChainId = chainId || currentChainId;
  
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const moralisService = MoralisContractService.getInstance();
  
  const fetchData = useCallback(async () => {
    // Don't run on server side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (!effectiveAddress || !isAddress(effectiveAddress) || !effectiveChainId) {
      setData(null);
      setError(null);
      return;
    }
    
    if (!moralisService.isChainSupported(effectiveChainId)) {
      setError(`Chain ${effectiveChainId} is not supported by Moralis`);
      setData(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await moralisService.getWalletData(effectiveAddress, effectiveChainId);
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wallet data';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [effectiveAddress, effectiveChainId, moralisService, onSuccess, onError]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

/**
 * Hook to fetch token price using Moralis
 */
export function useMoralisTokenPrice(
  tokenAddress: string,
  chainId?: number,
  onSuccess?: (data: TokenPrice) => void,
  onError?: (error: string) => void
): UseTokenPriceResult {
  const currentChainId = useChainId();
  const effectiveChainId = chainId || currentChainId;
  
  const [data, setData] = useState<TokenPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const moralisService = MoralisContractService.getInstance();
  
  const fetchData = useCallback(async () => {
    // Don't run on server side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (!tokenAddress || !isAddress(tokenAddress) || !effectiveChainId) {
      setData(null);
      setError(null);
      return;
    }
    
    if (!moralisService.isChainSupported(effectiveChainId)) {
      setError(`Chain ${effectiveChainId} is not supported by Moralis`);
      setData(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await moralisService.getTokenPrice(tokenAddress, effectiveChainId);
      if (result) {
        setData(result);
        onSuccess?.(result);
      } else {
        setError('Price data not available for this token');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token price';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, effectiveChainId, moralisService, onSuccess, onError]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

/**
 * Hook to fetch wallet token balances using Moralis
 */
export function useMoralisTokenBalances(
  walletAddress?: string,
  chainId?: number,
  onSuccess?: (data: TokenBalance[]) => void,
  onError?: (error: string) => void
): UseTokenBalancesResult {
  const { address: connectedAddress } = useAccount();
  const currentChainId = useChainId();
  
  const effectiveAddress = walletAddress || connectedAddress;
  const effectiveChainId = chainId || currentChainId;
  
  const [data, setData] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const moralisService = MoralisContractService.getInstance();
  
  const fetchData = useCallback(async () => {
    if (!effectiveAddress || !isAddress(effectiveAddress) || !effectiveChainId) {
      setData([]);
      setError(null);
      return;
    }
    
    if (!moralisService.isChainSupported(effectiveChainId)) {
      setError(`Chain ${effectiveChainId} is not supported by Moralis`);
      setData([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await moralisService.getWalletTokenBalances(effectiveAddress, effectiveChainId);
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token balances';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [effectiveAddress, effectiveChainId, moralisService, onSuccess, onError]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

/**
 * Hook to fetch wallet NFT collection using Moralis
 */
export function useMoralisNFTCollection(
  walletAddress?: string,
  chainId?: number,
  onSuccess?: (data: NFTData[]) => void,
  onError?: (error: string) => void
): UseNFTCollectionResult {
  const { address: connectedAddress } = useAccount();
  const currentChainId = useChainId();
  
  const effectiveAddress = walletAddress || connectedAddress;
  const effectiveChainId = chainId || currentChainId;
  
  const [data, setData] = useState<NFTData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const moralisService = MoralisContractService.getInstance();
  
  const fetchData = useCallback(async () => {
    // Don't run on server side
    if (typeof window === 'undefined') {
      return;
    }
    
    if (!effectiveAddress || !isAddress(effectiveAddress) || !effectiveChainId) {
      setData([]);
      setError(null);
      return;
    }
    
    if (!moralisService.isChainSupported(effectiveChainId)) {
      setError(`Chain ${effectiveChainId} is not supported by Moralis`);
      setData([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await moralisService.getWalletNFTs(effectiveAddress, effectiveChainId);
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch NFT collection';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [effectiveAddress, effectiveChainId, moralisService, onSuccess, onError]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch };
}

/**
 * Hook to get Moralis service configuration
 */
export function useMoralisConfig() {
  const chainId = useChainId();
  const moralisService = MoralisContractService.getInstance();
  
  return {
    isChainSupported: moralisService.isChainSupported(chainId),
    supportedChains: moralisService.getSupportedChains(),
    currentChainId: chainId,
    clearCache: () => moralisService.clearCache(),
  };
}

/**
 * Hook for batch processing multiple Moralis requests
 */
export function useMoralisBatch() {
  const moralisService = MoralisContractService.getInstance();
  
  const batchProcess = useCallback(async <T>(
    requests: (() => Promise<T>)[],
    batchSize: number = 5
  ): Promise<T[]> => {
    return moralisService.batchProcess(requests, batchSize);
  }, [moralisService]);
  
  return { batchProcess };
} 