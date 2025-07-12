import { ethers } from 'ethers';
import { NetworkConfig, NetworkStatus } from '../../types/network';
import { BlockchainTransactionResult, ContractCallParams, DeploymentParams, NetworkAdapter } from './network-adapter';

/**
 * Ethereum network adapter
 */
export class EthereumAdapter implements NetworkAdapter {
  private config: NetworkConfig;
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private status: NetworkStatus = NetworkStatus.DISCONNECTED;

  constructor(config: NetworkConfig) {
    this.config = config;
  }

  /**
   * Get the network configuration
   */
  getConfig(): NetworkConfig {
    return this.config;
  }

  /**
   * Initialize the Ethereum provider and wallet
   */
  async initialize(): Promise<boolean> {
    try {
      this.status = NetworkStatus.CONNECTING;
      
      // Get RPC URLs (primary + fallbacks)
      const rpcUrls = this.getRpcUrls();
      console.log(`Attempting to connect to ${this.config.name} with ${rpcUrls.length} RPC endpoints`);
      
      // Try each RPC URL until one works
      let providerInitialized = false;
      let lastError: Error | null = null;
      
      for (let i = 0; i < rpcUrls.length; i++) {
        const rpcUrl = rpcUrls[i];
        console.log(`Trying RPC URL ${i + 1}/${rpcUrls.length}: ${rpcUrl}`);
        
        try {
          // Create provider with timeout
          this.provider = new ethers.providers.JsonRpcProvider({
            url: rpcUrl,
            timeout: 10000, // 10 second timeout
          });
          
          // Test the connection with timeout
          const networkPromise = this.provider.getNetwork();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
          });
          
          const network = await Promise.race([networkPromise, timeoutPromise]);
          
          console.log(`Successfully connected to ${this.config.name} with chain ID: ${network.chainId}`);
          
          // Verify chain ID matches our config (if specified)
          if (this.config.chainId && network.chainId !== this.config.chainId) {
            console.warn(
              `Chain ID mismatch for ${this.config.name}: expected ${this.config.chainId}, got ${network.chainId}`
            );
            // Continue anyway - some networks might have different chain IDs
          }
          
          providerInitialized = true;
          break; // Success! Exit the loop
        } catch (rpcError: any) {
          console.warn(`Failed to connect to RPC ${rpcUrl}:`, rpcError.message);
          lastError = rpcError;
          this.provider = null; // Reset provider
          
          // If this isn't the last URL, try the next one
          if (i < rpcUrls.length - 1) {
            console.log('Trying next RPC URL...');
            continue;
          }
        }
      }
      
      if (!providerInitialized) {
        console.warn(`Failed to connect to any RPC endpoints for ${this.config.name}. Continuing in limited mode.`);
        console.warn('Last error:', lastError?.message || 'Unknown error');
        this.status = NetworkStatus.DISCONNECTED;
        // Return true to allow limited functionality
        return true;
      }
      
      // Initialize wallet if private key is available
      const privateKey = process.env.ETHEREUM_PRIVATE_KEY || process.env.PRIVATE_KEY;
      
      if (privateKey && !privateKey.includes('YOUR_PRIVATE_KEY')) {
        try {
          this.wallet = new ethers.Wallet(privateKey, this.provider);
          console.log(`Wallet initialized for ${this.config.name} with address: ${this.wallet.address}`);
        } catch (walletError: any) {
          console.warn(`Failed to initialize wallet for ${this.config.name}:`, walletError.message);
          console.warn('Continuing in read-only mode');
        }
      } else {
        console.log(`No private key configured for ${this.config.name} - operating in read-only mode`);
      }
      
      this.status = NetworkStatus.CONNECTED;
      console.log(`Successfully initialized ${this.config.name} network adapter`);
      return true;
    } catch (error: any) {
      console.warn(`Error initializing ${this.config.name} provider, continuing with limited functionality:`, error.message);
      this.status = NetworkStatus.DISCONNECTED;
      return true; // Return true to prevent app crashes
    }
  }

  /**
   * Get current network status
   */
  async getStatus(): Promise<NetworkStatus> {
    if (this.status === NetworkStatus.CONNECTED && this.provider) {
      try {
        // Do a simple call to ensure connection is still active
        await Promise.race([
          this.provider.getBlockNumber(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
      } catch (error) {
        console.warn(`Network status check failed for ${this.config.name}:`, error);
        this.status = NetworkStatus.DISCONNECTED;
      }
    }
    return this.status;
  }

  /**
   * Deploy a smart contract to Ethereum
   */
  async deployContract(params: DeploymentParams): Promise<BlockchainTransactionResult> {
    try {
      // Ensure provider is available
      if (!this.provider) {
        const initialized = await this.initialize();
        if (!initialized || !this.provider) {
          throw new Error(`${this.config.name} provider not available`);
        }
      }
      
      // Ensure we have a wallet for transactions
      if (!this.wallet) {
        throw new Error(`No wallet configured for ${this.config.name} transactions. Please set ETHEREUM_PRIVATE_KEY environment variable.`);
      }
      
      const { bytecode, abi, constructorArgs = [] } = params;
      
      // Create contract factory
      const contractFactory = new ethers.ContractFactory(abi, bytecode, this.wallet);
      
      // Estimate gas if not provided
      const gasLimit = params.gasLimit || (await this.estimateGas(params));
      
      // Transaction options
      const deployOptions: any = {
        gasLimit: gasLimit
      };
      
      // Add EIP-1559 fee parameters if provided
      if (params.maxFeePerGas) {
        deployOptions.maxFeePerGas = ethers.BigNumber.from(params.maxFeePerGas);
      }
      
      if (params.maxPriorityFeePerGas) {
        deployOptions.maxPriorityFeePerGas = ethers.BigNumber.from(params.maxPriorityFeePerGas);
      }
      
      console.log(`Deploying contract to ${this.config.name}...`);
      
      // Deploy the contract with constructor arguments
      const contract = await contractFactory.deploy(...constructorArgs, deployOptions);
      
      // Wait for contract to be deployed
      await contract.deployed();
      
      // Deployment transaction hash
      const txHash = contract.deployTransaction.hash;
      
      console.log(`Contract deployed successfully to ${this.config.name} at address: ${contract.address}`);
      
      return {
        success: true,
        contractAddress: contract.address,
        transactionHash: txHash,
        explorerUrl: this.getExplorerUrl('transaction', txHash || ''),
        gasUsed: contract.deployTransaction.gasLimit.toString()
      };
    } catch (error: any) {
      console.error(`Error deploying contract to ${this.config.name}:`, error);
      
      // Provide a friendly error message
      let errorMessage = `Failed to deploy contract to ${this.config.name}`;
      
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
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
      // Ensure provider is available
      if (!this.provider) {
        const initialized = await this.initialize();
        if (!initialized || !this.provider) {
          throw new Error(`${this.config.name} provider not available`);
        }
      }
      
      const { contractAddress, functionName, parameters = [], isQuery, abi } = params;
      
      if (!abi) {
        throw new Error('ABI is required for contract calls');
      }
      
      // Create contract instance
      const contract = new ethers.Contract(
        contractAddress,
        abi,
        isQuery ? this.provider : this.wallet || this.provider
      );
      
      if (isQuery) {
        // Read-only call (no transaction)
        console.log(`Calling read function ${functionName} on ${this.config.name}`);
        const result = await Promise.race([
          contract[functionName](...parameters),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Read call timeout')), 15000))
        ]);
        
        return {
          success: true,
          outputData: result,
          contractAddress
        };
      } else {
        // Ensure we have a wallet for transactions
        if (!this.wallet) {
          throw new Error(`No wallet configured for ${this.config.name} transactions. Please set ETHEREUM_PRIVATE_KEY environment variable.`);
        }
        
        // Estimate gas if not provided
        const gasLimit = params.gasLimit || (await this.estimateGas(params));
        
        // Transaction options
        const callOptions: any = {
          gasLimit: gasLimit
        };
        
        // Add EIP-1559 fee parameters if provided
        if (params.maxFeePerGas) {
          callOptions.maxFeePerGas = ethers.BigNumber.from(params.maxFeePerGas);
        }
        
        if (params.maxPriorityFeePerGas) {
          callOptions.maxPriorityFeePerGas = ethers.BigNumber.from(params.maxPriorityFeePerGas);
        }
        
        // Add ETH value if provided
        if (params.value) {
          callOptions.value = ethers.BigNumber.from(params.value);
        }
        
        console.log(`Calling write function ${functionName} on ${this.config.name}`);
        
        // Execute the transaction
        const tx = await contract[functionName](...parameters, callOptions);
        const receipt = await tx.wait();
        
        console.log(`Transaction completed on ${this.config.name}: ${receipt.transactionHash}`);
        
        return {
          success: true,
          transactionHash: receipt.transactionHash || tx.hash,
          gasUsed: receipt.gasUsed?.toString() || gasLimit.toString(),
          blockNumber: receipt.blockNumber,
          explorerUrl: this.getExplorerUrl('transaction', receipt.transactionHash || tx.hash),
          receipt,
          contractAddress
        };
      }
    } catch (error: any) {
      console.error(`Error calling contract function on ${this.config.name}:`, error);
      
      let errorMessage = `Failed to call contract function on ${this.config.name}`;
      
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get contract bytecode from address
   */
  async getContractBytecode(contractAddress: string): Promise<string> {
    try {
      // Ensure provider is available
      if (!this.provider) {
        const initialized = await this.initialize();
        if (!initialized || !this.provider) {
          throw new Error(`${this.config.name} provider not available`);
        }
      }
      
      const bytecode = await Promise.race([
        this.provider.getCode(contractAddress),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Bytecode fetch timeout')), 10000))
      ]);
      
      if (bytecode === '0x') {
        throw new Error(`No contract found at address ${contractAddress} on ${this.config.name}`);
      }
      
      return bytecode;
    } catch (error: any) {
      console.error(`Error getting contract bytecode from ${this.config.name}:`, error);
      throw error;
    }
  }

  /**
   * Get contract ABI from address using Etherscan API if available
   */
  async getContractAbi(contractAddress: string): Promise<any[] | null> {
    try {
      if (!this.config.ethereumConfig?.blockExplorerApiUrl || !this.config.ethereumConfig?.apiKey) {
        console.log(`No block explorer API configured for ${this.config.name} - cannot fetch ABI automatically`);
        return null;
      }
      
      const apiUrl = this.config.ethereumConfig.blockExplorerApiUrl;
      const apiKey = this.config.ethereumConfig.apiKey;
      
      const url = `${apiUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`;
      
      console.log(`Fetching ABI for contract ${contractAddress} from ${this.config.name} explorer`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Karibu-Smart-Contract-Analyzer/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === '1' && data.result) {
        try {
          // Parse ABI JSON
          const abi = JSON.parse(data.result);
          console.log(`Successfully fetched ABI for contract ${contractAddress} on ${this.config.name}`);
          return abi;
        } catch (parseError) {
          console.error(`Error parsing ABI for ${contractAddress} on ${this.config.name}:`, parseError);
          return null;
        }
      }
      
      console.warn(`No ABI found for contract ${contractAddress} on ${this.config.name}`);
      return null;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn(`ABI fetch timeout for ${contractAddress} on ${this.config.name}`);
      } else {
        console.warn(`Error getting contract ABI for ${contractAddress} on ${this.config.name}:`, error.message);
      }
      return null;
    }
  }

  /**
   * Format explorer URL for transaction
   */
  getExplorerUrl(type: 'transaction' | 'address' | 'block', hash: string): string {
    const baseUrl = this.config.explorerUrl;
    
    switch (type) {
      case 'transaction':
        return `${baseUrl}/tx/${hash}`;
      case 'address':
        return `${baseUrl}/address/${hash}`;
      case 'block':
        return `${baseUrl}/block/${hash}`;
      default:
        return baseUrl;
    }
  }

  /**
   * Format address for this network (Ethereum uses standard 0x format)
   */
  formatAddress(address: string): string {
    // Ensure it's a valid Ethereum address format
    if (!address.startsWith('0x')) {
      return `0x${address}`;
    }
    return address.toLowerCase();
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(params: DeploymentParams | ContractCallParams): Promise<number> {
    try {
      // Ensure provider is available
      if (!this.provider) {
        const initialized = await this.initialize();
        if (!initialized || !this.provider) {
          console.warn(`${this.config.name} provider not available for gas estimation, using default`);
          return 'bytecode' in params ? 2000000 : 500000; // Default gas limits
        }
      }
      
      if ('bytecode' in params) {
        // Contract deployment gas estimation
        const { bytecode, abi, constructorArgs = [] } = params as DeploymentParams;
        
        try {
          // Create transaction data
          const contractFactory = new ethers.ContractFactory(abi, bytecode, this.wallet || this.provider.getSigner());
          const deploymentData = contractFactory.interface.encodeDeploy(constructorArgs);
          
          // Estimate gas with timeout
          const gasEstimate = await Promise.race([
            this.provider.estimateGas({
              data: bytecode + deploymentData.slice(2) // Remove '0x' from deploymentData
            }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Gas estimation timeout')), 10000)
            )
          ]);
          
          // Add 20% buffer
          const gasWithBuffer = Math.ceil(gasEstimate.toNumber() * 1.2);
          console.log(`Gas estimated for deployment on ${this.config.name}: ${gasWithBuffer}`);
          return gasWithBuffer;
        } catch (error: any) {
          console.warn(`Gas estimation failed for deployment on ${this.config.name}:`, error.message);
          return 2000000; // Default for deployment
        }
      } else {
        // Contract function call gas estimation
        const { contractAddress, functionName, parameters = [], abi } = params as ContractCallParams;
        
        if (!abi) {
          console.warn(`No ABI provided for gas estimation on ${this.config.name}, using default`);
          return 500000; // Default for function calls
        }
        
        try {
          // Create contract instance
          const contract = new ethers.Contract(contractAddress, abi, this.provider);
          
          // Prepare call options
          const options: any = {};
          if ((params as ContractCallParams).value) {
            options.value = ethers.BigNumber.from((params as ContractCallParams).value);
          }
          
          // Estimate gas with timeout
          const gasEstimate = await Promise.race([
            contract.estimateGas[functionName](...parameters, options),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Gas estimation timeout')), 10000)
            )
          ]);
          
          // Add 20% buffer
          const gasWithBuffer = Math.ceil(gasEstimate.toNumber() * 1.2);
          console.log(`Gas estimated for ${functionName} on ${this.config.name}: ${gasWithBuffer}`);
          return gasWithBuffer;
        } catch (error: any) {
          console.warn(`Gas estimation failed for ${functionName} on ${this.config.name}:`, error.message);
          return 500000; // Default for function calls
        }
      }
    } catch (error: any) {
      console.warn(`Gas estimation error on ${this.config.name}:`, error.message);
      return 'bytecode' in params ? 2000000 : 500000; // Safe defaults
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      // Ensure provider is available
      if (!this.provider) {
        const initialized = await this.initialize();
        if (!initialized || !this.provider) {
          console.warn(`${this.config.name} provider not available for gas price, using default`);
          return '20000000000'; // 20 Gwei default
        }
      }
      
      const gasPrice = await Promise.race([
        this.provider.getGasPrice(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Gas price fetch timeout')), 5000)
        )
      ]);
      
      console.log(`Current gas price on ${this.config.name}: ${gasPrice.toString()} wei`);
      return gasPrice.toString();
    } catch (error: any) {
      console.warn(`Error getting gas price from ${this.config.name}:`, error.message);
      // Return a reasonable default based on network
      switch (this.config.id) {
        case 'polygon-mainnet':
          return '30000000000'; // 30 Gwei for Polygon
        case 'arbitrum-one':
          return '100000000'; // 0.1 Gwei for Arbitrum
        case 'optimism-mainnet':
          return '1000000'; // 0.001 Gwei for Optimism
        default:
          return '20000000000'; // 20 Gwei for Ethereum and others
      }
    }
  }

  /**
   * Get RPC URLs for this network (primary + fallbacks)
   */
  private getRpcUrls(): string[] {
    const urls: string[] = [this.config.rpcUrl];
    
    // Add fallback URLs based on network
    switch (this.config.id) {
      case 'ethereum-mainnet':
        urls.push(
          'https://eth.llamarpc.com',
          'https://rpc.ankr.com/eth',
          'https://ethereum.publicnode.com',
          'https://eth.drpc.org'
        );
        break;
      case 'ethereum-sepolia':
        urls.push(
          'https://rpc2.sepolia.org',
          'https://rpc.sepolia.org',
          'https://ethereum-sepolia.publicnode.com'
        );
        break;
      case 'polygon-mainnet':
        urls.push(
          'https://polygon.llamarpc.com',
          'https://rpc.ankr.com/polygon',
          'https://polygon.drpc.org'
        );
        break;
      case 'optimism-mainnet':
        urls.push(
          'https://optimism.llamarpc.com',
          'https://rpc.ankr.com/optimism',
          'https://optimism.drpc.org'
        );
        break;
      case 'arbitrum-one':
        urls.push(
          'https://arbitrum.llamarpc.com',
          'https://rpc.ankr.com/arbitrum',
          'https://arbitrum.drpc.org'
        );
        break;
      case 'base-mainnet':
        urls.push(
          'https://base.llamarpc.com',
          'https://rpc.ankr.com/base',
          'https://base.drpc.org'
        );
        break;
      // Add more networks as needed
    }
    
    // Remove duplicates and filter out invalid URLs
    return [...new Set(urls)].filter(url => url && url.startsWith('http'));
  }
} 