/**
 * Moralis Contract Service
 * Enhanced to use Moralis API to its fullest potential
 */

import Moralis from 'moralis';

export interface ContractData {
  address: string;
  chainId: number;
  name?: string;
  symbol?: string;
  abi?: any[];
  isVerified: boolean;
  sourceCode?: string;
  bytecode?: string;
  deploymentTxHash?: string;
  creator?: string;
  creationDate?: string;
  compiler?: string;
  optimizationEnabled?: boolean;
  runs?: number;
  evmVersion?: string;
  contractType?: 'ERC20' | 'ERC721' | 'ERC1155' | 'OTHER';
  decimals?: number;
  totalSupply?: string;
  logo?: string;
  // Enhanced properties
  holders?: number;
  marketCap?: string;
  price?: string;
  priceChangePercent?: number;
  volume24h?: string;
}

export interface TransactionData {
  hash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  status: string;
  timestamp: string;
  nonce: number;
  input: string;
  // Enhanced properties
  methodName?: string;
  decodedInput?: any;
  logs?: any[];
  internalTransactions?: any[];
}

export interface NFTData {
  tokenAddress: string;
  tokenId: string;
  name?: string;
  description?: string;
  image?: string;
  animationUrl?: string;
  attributes?: any[];
  owner?: string;
  tokenUri?: string;
  metadata?: any;
  contractType?: string;
  lastMetadataSync?: string;
  lastTokenUriSync?: string;
}

export interface WalletData {
  address: string;
  nativeBalance: string;
  tokenBalances: TokenBalance[];
  nftBalances: NFTData[];
  totalValue?: string;
  chains: number[];
}

export interface TokenBalance {
  tokenAddress: string;
  symbol: string;
  name: string;
  logo?: string;
  decimals: number;
  balance: string;
  possibleSpam: boolean;
  verifiedContract: boolean;
  price?: string;
  value?: string;
  percentChange24h?: number;
}

export interface DeFiPosition {
  protocolName: string;
  protocolLogo?: string;
  tokenAddress: string;
  symbol: string;
  balance: string;
  value: string;
  type: 'lending' | 'borrowing' | 'staking' | 'farming' | 'liquidity';
}

export interface TokenPrice {
  tokenAddress: string;
  symbol: string;
  name: string;
  usdPrice: number;
  nativePrice?: number;
  priceChangePercent24h: number;
  marketCap?: number;
  volume24h?: number;
}

export class MoralisContractService {
  private static instance: MoralisContractService;
  private isInitialized = false;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private rateLimitDelay = 100; // ms between requests
  private lastRequestTime = 0;
  
  private constructor() {}
  
  static getInstance(): MoralisContractService {
    if (!MoralisContractService.instance) {
      MoralisContractService.instance = new MoralisContractService();
    }
    return MoralisContractService.instance;
  }
  
  /**
   * Initialize Moralis (call this once when app starts)
   */
  async initialize(): Promise<void> {
    // Don't initialize on server side or during build
    if (typeof window === 'undefined') {
      console.log('Skipping Moralis initialization on server side');
      return;
    }
    
    if (this.isInitialized) return;
    
    const apiKey = process.env.NEXT_PUBLIC_MORALIS_API_KEY;
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_MORALIS_API_KEY is not set in environment variables');
    }
    
    try {
      if (!Moralis.Core.isStarted) {
        await Moralis.start({
          apiKey: apiKey,
        });
      }
      
      this.isInitialized = true;
      console.log('Moralis initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Moralis:', error);
      // Don't throw error during initialization to prevent build failures
      // The hooks will handle individual errors gracefully
    }
  }

  /**
   * Rate limiting helper
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Cache helper
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    return null;
  }

  private setCache(key: string, data: any, ttlMs: number = 300000): void { // 5 min default
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
  }
  
  /**
   * Get comprehensive contract information
   */
  async getContractInfo(address: string, chainId: number): Promise<ContractData> {
    // Don't run on server side
    if (typeof window === 'undefined') {
      throw new Error('Moralis service is not available on server side');
    }
    
    await this.initialize();
    
    if (!this.isInitialized) {
      throw new Error('Moralis service failed to initialize');
    }
    
    await this.rateLimit();
    
    const cacheKey = `contract_${address}_${chainId}`;
    const cached = this.getCached<ContractData>(cacheKey);
    if (cached) return cached;
    
    console.log(`Fetching comprehensive contract info for ${address} on chain ${chainId} via Moralis`);
    
    const contractData: ContractData = {
      address,
      chainId,
      isVerified: false,
    };
    
    try {
      // Get token metadata (for ERC20/ERC721/ERC1155)
      try {
        const tokenData = await this.getTokenMetadata(address, chainId);
        Object.assign(contractData, tokenData);
        
        if (contractData.name || contractData.symbol) {
          contractData.isVerified = true;
        }
      } catch (error) {
        console.warn('Failed to fetch token metadata:', error);
      }

      // Get contract bytecode using runContractFunction (available in free tier)
      try {
        const bytecode = await this.getContractBytecode(address, chainId);
        contractData.bytecode = bytecode;
      } catch (error) {
        console.warn('Failed to fetch bytecode:', error);
      }

      // Get token price and market data if it's a token
      if (contractData.contractType && contractData.contractType !== 'OTHER') {
        try {
          const priceData = await this.getTokenPrice(address, chainId);
          if (priceData) {
            contractData.price = priceData.usdPrice.toString();
            contractData.priceChangePercent = priceData.priceChangePercent24h;
            contractData.marketCap = priceData.marketCap?.toString();
            contractData.volume24h = priceData.volume24h?.toString();
          }
        } catch (error) {
          console.warn('Failed to fetch token price data:', error);
        }
      }

      // Get holder count for tokens
      if (contractData.contractType === 'ERC20') {
        try {
          const holders = await this.getTokenHolders(address, chainId);
          contractData.holders = holders.length;
        } catch (error) {
          console.warn('Failed to fetch holder count:', error);
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch contract metadata from Moralis:', error);
      throw error;
    }
    
    this.setCache(cacheKey, contractData);
    return contractData;
  }
  
  /**
   * Get token metadata (for ERC20/ERC721/ERC1155 tokens)
   */
  async getTokenMetadata(address: string, chainId: number): Promise<Partial<ContractData>> {
    await this.initialize();
    await this.rateLimit();
    
    try {
      const response = await Moralis.EvmApi.token.getTokenMetadata({
        chain: this.mapChainIdToMoralisChain(chainId),
        addresses: [address],
      });
      
      if (response?.result && Array.isArray(response.result) && response.result.length > 0) {
        const tokenData = response.result[0] as any;
        const token = tokenData.token || tokenData;
        
        return {
          name: token.name || undefined,
          symbol: token.symbol || undefined,
          decimals: token.decimals || undefined,
          totalSupply: token.totalSupply?.toString() || undefined,
          logo: token.logo || undefined,
          contractType: this.detectContractTypeFromMetadata(token),
        };
      }
    } catch (error) {
      console.warn('Failed to fetch token metadata:', error);
    }
    
    return {};
  }

  /**
   * Get contract bytecode using runContractFunction (available in free tier)
   */
  async getContractBytecode(address: string, chainId: number): Promise<string> {
    await this.initialize();
    await this.rateLimit();
    
    try {
      const response = await Moralis.EvmApi.utils.runContractFunction({
        chain: this.mapChainIdToMoralisChain(chainId),
        address: address,
        functionName: 'eth_getCode',
        abi: [],
        params: { address: address, blockTag: 'latest' }
      });
      
      return response?.result || '0x';
    } catch (error) {
      console.warn('Failed to fetch bytecode via runContractFunction:', error);
      return '0x';
    }
  }
  
  /**
   * Get enhanced transaction details with decoded data
   */
  async getTransactionDetails(txHash: string, chainId: number): Promise<TransactionData | null> {
    if (typeof window === 'undefined') {
      throw new Error('Moralis service is not available on server side');
    }
    
    await this.initialize();
    if (!this.isInitialized) {
      throw new Error('Moralis service failed to initialize');
    }
    
    await this.rateLimit();
    
    const cacheKey = `tx_${txHash}_${chainId}`;
    const cached = this.getCached<TransactionData>(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await Moralis.EvmApi.transaction.getTransaction({
        chain: this.mapChainIdToMoralisChain(chainId),
        transactionHash: txHash,
      });
      
      if (response?.result) {
        const tx = response.result as any;
        
        // Get transaction logs/events
        let logs: any[] = [];
        try {
          const logsResponse = await Moralis.EvmApi.transaction.getTransactionVerbose({
            chain: this.mapChainIdToMoralisChain(chainId),
            transactionHash: txHash,
          });
          logs = logsResponse?.result?.logs || [];
        } catch (error) {
          console.warn('Failed to fetch transaction logs:', error);
        }

        const transactionData: TransactionData = {
          hash: tx.hash || txHash,
          blockNumber: parseInt(tx.blockNumber?.toString() || '0'),
          blockHash: tx.blockHash || '',
          from: tx.from || tx.fromAddress || '',
          to: tx.to || tx.toAddress || '',
          value: tx.value?.toString() || '0',
          gas: tx.gas?.toString() || '0',
          gasPrice: tx.gasPrice?.toString() || '0',
          gasUsed: tx.gasUsed?.toString() || tx.receiptGasUsed?.toString() || '0',
          status: tx.status === 1 || tx.status === '1' ? 'success' : 'failed',
          timestamp: tx.timestamp?.toString() || tx.blockTimestamp?.toString() || '',
          nonce: parseInt(tx.nonce?.toString() || '0'),
          input: tx.input || tx.data || '',
          logs: logs,
          decodedInput: tx.decodedCall || undefined,
          methodName: tx.decodedCall?.label || undefined,
        };

        this.setCache(cacheKey, transactionData);
        return transactionData;
      }
    } catch (error) {
      console.error('Failed to fetch transaction details:', error);
    }
    
    return null;
  }
  
  /**
   * Get contract events with proper implementation
   */
  async getContractEvents(
    address: string, 
    chainId: number, 
    options: {
      fromBlock?: number;
      toBlock?: number;
      limit?: number;
      topic0?: string;
      topic1?: string;
      topic2?: string;
      topic3?: string;
    } = {}
  ): Promise<any[]> {
    await this.initialize();
    await this.rateLimit();
    
    try {
      const params: any = {
        chain: this.mapChainIdToMoralisChain(chainId),
        address: address,
        limit: options.limit || 10,
      };

      if (options.fromBlock) params.fromBlock = options.fromBlock;
      if (options.toBlock) params.toBlock = options.toBlock;
      if (options.topic0) params.topic0 = options.topic0;
      if (options.topic1) params.topic1 = options.topic1;
      if (options.topic2) params.topic2 = options.topic2;
      if (options.topic3) params.topic3 = options.topic3;

      const response = await Moralis.EvmApi.events.getContractLogs(params);
      
      return response?.result || [];
    } catch (error) {
      console.error('Failed to fetch contract events:', error);
      return [];
    }
  }

  /**
   * Get NFT metadata and ownership
   */
  async getNFTMetadata(address: string, tokenId: string, chainId: number): Promise<NFTData | null> {
    if (typeof window === 'undefined') {
      throw new Error('Moralis service is not available on server side');
    }
    
    await this.initialize();
    if (!this.isInitialized) {
      throw new Error('Moralis service failed to initialize');
    }
    
    await this.rateLimit();
    
    const cacheKey = `nft_${address}_${tokenId}_${chainId}`;
    const cached = this.getCached<NFTData>(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await Moralis.EvmApi.nft.getNFTMetadata({
        chain: this.mapChainIdToMoralisChain(chainId),
        address: address,
        tokenId: tokenId,
      });
      
      if (response?.result) {
        const nft = response.result as any;
        const metadata = typeof nft.metadata === 'string' 
          ? JSON.parse(nft.metadata) 
          : nft.metadata;
        
        const nftData: NFTData = {
          tokenAddress: address,
          tokenId: tokenId,
          name: metadata?.name || nft.name,
          description: metadata?.description,
          image: metadata?.image,
          animationUrl: metadata?.animation_url,
          attributes: metadata?.attributes || [],
          owner: nft.ownerOf,
          tokenUri: nft.tokenUri,
          metadata: metadata,
          contractType: nft.contractType,
          lastMetadataSync: nft.lastMetadataSync,
          lastTokenUriSync: nft.lastTokenUriSync,
        };

        this.setCache(cacheKey, nftData, 600000); // 10 min cache for NFTs
        return nftData;
      }
    } catch (error) {
      console.error('Failed to fetch NFT metadata:', error);
    }
    
    return null;
  }

  /**
   * Get wallet token balances
   */
  async getWalletTokenBalances(walletAddress: string, chainId: number): Promise<TokenBalance[]> {
    if (typeof window === 'undefined') {
      throw new Error('Moralis service is not available on server side');
    }
    
    await this.initialize();
    if (!this.isInitialized) {
      throw new Error('Moralis service failed to initialize');
    }
    
    await this.rateLimit();
    
    const cacheKey = `wallet_tokens_${walletAddress}_${chainId}`;
    const cached = this.getCached<TokenBalance[]>(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        chain: this.mapChainIdToMoralisChain(chainId),
        address: walletAddress,
      });
      
      if (response?.result) {
        const balances: TokenBalance[] = response.result.map((token: any) => ({
          tokenAddress: token.tokenAddress,
          symbol: token.symbol,
          name: token.name,
          logo: token.logo,
          decimals: token.decimals,
          balance: token.balance,
          possibleSpam: token.possibleSpam || false,
          verifiedContract: token.verifiedContract || false,
        }));

        this.setCache(cacheKey, balances, 60000); // 1 min cache for balances
        return balances;
      }
    } catch (error) {
      console.error('Failed to fetch wallet token balances:', error);
    }
    
    return [];
  }

  /**
   * Get wallet NFT balances
   */
  async getWalletNFTs(walletAddress: string, chainId: number): Promise<NFTData[]> {
    if (typeof window === 'undefined') {
      throw new Error('Moralis service is not available on server side');
    }
    
    await this.initialize();
    if (!this.isInitialized) {
      throw new Error('Moralis service failed to initialize');
    }
    
    await this.rateLimit();
    
    const cacheKey = `wallet_nfts_${walletAddress}_${chainId}`;
    const cached = this.getCached<NFTData[]>(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        chain: this.mapChainIdToMoralisChain(chainId),
        address: walletAddress,
        limit: 100,
      });
      
      if (response?.result) {
        const nfts: NFTData[] = response.result.map((nft: any) => {
          const metadata = typeof nft.metadata === 'string' 
            ? JSON.parse(nft.metadata || '{}') 
            : (nft.metadata || {});
          
          return {
            tokenAddress: nft.tokenAddress,
            tokenId: nft.tokenId,
            name: metadata.name || nft.name,
            description: metadata.description,
            image: metadata.image,
            animationUrl: metadata.animation_url,
            attributes: metadata.attributes || [],
            tokenUri: nft.tokenUri,
            metadata: metadata,
            contractType: nft.contractType,
            lastMetadataSync: nft.lastMetadataSync,
            lastTokenUriSync: nft.lastTokenUriSync,
          };
        });

        this.setCache(cacheKey, nfts, 300000); // 5 min cache for NFTs
        return nfts;
      }
    } catch (error) {
      console.error('Failed to fetch wallet NFTs:', error);
    }
    
    return [];
  }

  /**
   * Get token price data
   */
  async getTokenPrice(address: string, chainId: number): Promise<TokenPrice | null> {
    if (typeof window === 'undefined') {
      throw new Error('Moralis service is not available on server side');
    }
    
    await this.initialize();
    if (!this.isInitialized) {
      throw new Error('Moralis service failed to initialize');
    }
    
    await this.rateLimit();
    
    const cacheKey = `price_${address}_${chainId}`;
    const cached = this.getCached<TokenPrice>(cacheKey);
    if (cached) return cached;
    
    try {
      const response = await Moralis.EvmApi.token.getTokenPrice({
        chain: this.mapChainIdToMoralisChain(chainId),
        address: address,
      });
      
      if (response?.result) {
        const price = response.result as any;
        const priceData: TokenPrice = {
          tokenAddress: address,
          symbol: price.tokenSymbol,
          name: price.tokenName,
          usdPrice: parseFloat(price.usdPrice || '0'),
          nativePrice: price.nativePrice ? parseFloat(price.nativePrice.value) : undefined,
          priceChangePercent24h: parseFloat(price['24hrPercentChange'] || '0'),
          marketCap: price.marketCap ? parseFloat(price.marketCap) : undefined,
          volume24h: price.volume24h ? parseFloat(price.volume24h) : undefined,
        };

        this.setCache(cacheKey, priceData, 60000); // 1 min cache for prices
        return priceData;
      }
    } catch (error) {
      console.warn('Failed to fetch token price (may not be available for this token):', error);
    }
    
    return null;
  }

  /**
   * Get token holders
   */
  async getTokenHolders(address: string, chainId: number, limit: number = 100): Promise<any[]> {
    await this.initialize();
    await this.rateLimit();
    
    try {
      const response = await Moralis.EvmApi.token.getTokenOwners({
        chain: this.mapChainIdToMoralisChain(chainId),
        tokenAddress: address,
        limit: limit,
      });
      
      return response?.result || [];
    } catch (error) {
      console.warn('Failed to fetch token holders:', error);
      return [];
    }
  }

  /**
   * Get comprehensive wallet data
   */
  async getWalletData(walletAddress: string, chainId: number): Promise<WalletData> {
    if (typeof window === 'undefined') {
      throw new Error('Moralis service is not available on server side');
    }
    
    await this.initialize();
    if (!this.isInitialized) {
      throw new Error('Moralis service failed to initialize');
    }
    
    const [tokenBalances, nftBalances, nativeBalance] = await Promise.all([
      this.getWalletTokenBalances(walletAddress, chainId),
      this.getWalletNFTs(walletAddress, chainId),
      this.getNativeBalance(walletAddress, chainId),
    ]);

    return {
      address: walletAddress,
      nativeBalance: nativeBalance,
      tokenBalances: tokenBalances,
      nftBalances: nftBalances,
      chains: [chainId],
    };
  }

  /**
   * Get native balance
   */
  async getNativeBalance(walletAddress: string, chainId: number): Promise<string> {
    await this.initialize();
    await this.rateLimit();
    
    try {
      const response = await Moralis.EvmApi.balance.getNativeBalance({
        chain: this.mapChainIdToMoralisChain(chainId),
        address: walletAddress,
      });
      
      return response?.result?.balance?.toString() || '0';
    } catch (error) {
      console.error('Failed to fetch native balance:', error);
      return '0';
    }
  }

  /**
   * Detect contract type from metadata
   */
  private detectContractTypeFromMetadata(token: any): ContractData['contractType'] {
    if (token.contractType) {
      return token.contractType.toUpperCase();
    }
    
    // Fallback detection based on properties
    if (token.decimals !== undefined && token.totalSupply !== undefined) {
      return 'ERC20';
    }
    
    return 'OTHER';
  }
  
  /**
   * Map chain ID to Moralis chain identifier
   */
  private mapChainIdToMoralisChain(chainId: number): string {
    const chainMapping: { [key: number]: string } = {
      1: '0x1',        // Ethereum Mainnet
      11155111: '0xaa36a7', // Sepolia
      137: '0x89',     // Polygon
      80002: '0x13882', // Polygon Amoy
      10: '0xa',       // Optimism
      11155420: '0xaa37dc', // Optimism Sepolia
      42161: '0xa4b1', // Arbitrum One
      421614: '0x66eee', // Arbitrum Sepolia
      8453: '0x2105', // Base
      84532: '0x14a34', // Base Sepolia
      56: '0x38',      // BSC
      97: '0x61',      // BSC Testnet
      43114: '0xa86a', // Avalanche
      43113: '0xa869', // Fuji
      250: '0xfa',     // Fantom
      4002: '0xfa2',   // Fantom Testnet
      25: '0x19',      // Cronos
      338: '0x152',    // Cronos Testnet
      100: '0x64',     // Gnosis
      5000: '0x1388', // Mantle
      5003: '0x138b', // Mantle Sepolia
      534352: '0x82750', // Scroll
      534351: '0x8274f', // Scroll Sepolia
      59144: '0xe708', // Linea
      59141: '0xe705', // Linea Sepolia
      324: '0x144',    // zkSync Era
      300: '0x12c',    // zkSync Sepolia
    };
    
    return chainMapping[chainId] || `0x${chainId.toString(16)}`;
  }
  
  /**
   * Detect contract type based on ABI
   */
  private detectContractType(abi: any[]): ContractData['contractType'] {
    if (!abi || abi.length === 0) return 'OTHER';
    
    const functionNames = abi
      .filter(item => item.type === 'function')
      .map(item => item.name);
    
    // Check for ERC20
    const erc20Functions = ['transfer', 'approve', 'transferFrom', 'balanceOf', 'allowance'];
    const hasErc20Functions = erc20Functions.every(fn => functionNames.includes(fn));
    if (hasErc20Functions) return 'ERC20';
    
    // Check for ERC721
    const erc721Functions = ['ownerOf', 'safeTransferFrom', 'transferFrom', 'approve', 'getApproved'];
    const hasErc721Functions = erc721Functions.some(fn => functionNames.includes(fn));
    if (hasErc721Functions && functionNames.includes('tokenURI')) return 'ERC721';
    
    // Check for ERC1155
    const erc1155Functions = ['safeTransferFrom', 'safeBatchTransferFrom', 'balanceOf', 'balanceOfBatch'];
    const hasErc1155Functions = erc1155Functions.some(fn => functionNames.includes(fn));
    if (hasErc1155Functions && functionNames.includes('uri')) return 'ERC1155';
    
    return 'OTHER';
  }
  
  /**
   * Get supported chains
   */
  getSupportedChains(): number[] {
    return [
      1, 11155111,     // Ethereum
      137, 80002,      // Polygon
      10, 11155420,    // Optimism
      42161, 421614,   // Arbitrum
      8453, 84532,     // Base
      56, 97,          // BSC
      43114, 43113,    // Avalanche
      250, 4002,       // Fantom
      25, 338,         // Cronos
      100,             // Gnosis
      5000, 5003,      // Mantle
      534352, 534351,  // Scroll
      59144, 59141,    // Linea
      324, 300,        // zkSync Era
    ];
  }
  
  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: number): boolean {
    return this.getSupportedChains().includes(chainId);
  }

  /**
   * Clear cache (useful for refreshing data)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Batch process multiple requests with proper rate limiting
   */
  async batchProcess<T>(
    requests: (() => Promise<T>)[],
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(request => request())
      );
      
      const successfulResults = batchResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => (result as PromiseFulfilledResult<T>).value);
      
      results.push(...successfulResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay * batchSize));
      }
    }
    
    return results;
  }
} 