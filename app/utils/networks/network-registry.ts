import { NetworkConfig, NetworkEnvironment, NetworkType } from "../../types/network";

/**
 * Default network configurations
 */
const DEFAULT_NETWORKS: NetworkConfig[] = [
  // Hedera Testnet (existing network)
  {
    id: 'hedera-testnet',
    name: 'Hedera Testnet',
    type: 'hedera',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://testnet.hashio.io/api',
    explorerUrl: 'https://hashscan.io/testnet',
    chainId: 296, // Add chainId for RainbowKit compatibility
    hederaConfig: {
      mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com/api/v1'
    }
  },
  // Hedera Mainnet
  {
    id: 'hedera-mainnet',
    name: 'Hedera Mainnet',
    type: 'hedera',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://mainnet.hashio.io/api',
    explorerUrl: 'https://hashscan.io/mainnet',
    chainId: 295, // Add chainId for RainbowKit compatibility
    hederaConfig: {
      mirrorNodeUrl: 'https://mainnet-public.mirrornode.hedera.com/api/v1'
    }
  },
  // Ethereum Sepolia Testnet
  {
    id: 'ethereum-sepolia',
    name: 'Sepolia Testnet',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    chainId: 11155111,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-sepolia.etherscan.io/api'
    }
  },
  // Ethereum Goerli Testnet
  {
    id: 'ethereum-goerli',
    name: 'Goerli Testnet',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.ankr.com/eth_goerli',
    explorerUrl: 'https://goerli.etherscan.io',
    chainId: 5,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-goerli.etherscan.io/api'
    }
  },
  // Polygon PoS (Mainnet)
  {
    id: 'polygon-mainnet',
    name: 'Polygon',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    chainId: 137,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.polygonscan.com/api'
    }
  },
  // Optimism (Mainnet)
  {
    id: 'optimism-mainnet',
    name: 'Optimism',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    chainId: 10,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-optimistic.etherscan.io/api'
    }
  },
  // Arbitrum One (Mainnet)
  {
    id: 'arbitrum-one',
    name: 'Arbitrum One',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    chainId: 42161,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.arbiscan.io/api'
    }
  },
  // Base (Mainnet)
  {
    id: 'base-mainnet',
    name: 'Base',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    chainId: 8453,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.basescan.org/api'
    }
  },
  // Zora (Mainnet)
  {
    id: 'zora-mainnet',
    name: 'Zora',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.zora.energy',
    explorerUrl: 'https://explorer.zora.energy',
    chainId: 7777777,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://explorer.zora.energy/api'
    }
  },
  // Optimism Sepolia Testnet
  {
    id: 'optimism-sepolia',
    name: 'Optimism Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://sepolia.optimism.io',
    explorerUrl: 'https://sepolia-optimistic.etherscan.io',
    chainId: 11155420,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-sepolia-optimistic.etherscan.io/api'
    }
  },
  // Arbitrum Sepolia Testnet
  {
    id: 'arbitrum-sepolia',
    name: 'Arbitrum Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    explorerUrl: 'https://sepolia.arbiscan.io',
    chainId: 421614,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-sepolia.arbiscan.io/api'
    }
  },
  // Base Sepolia Testnet
  {
    id: 'base-sepolia',
    name: 'Base Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://sepolia.base.org',
    explorerUrl: 'https://sepolia.basescan.org',
    chainId: 84532,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-sepolia.basescan.org/api'
    }
  },
  // Zora Sepolia Testnet
  {
    id: 'zora-sepolia',
    name: 'Zora Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://sepolia.rpc.zora.energy',
    explorerUrl: 'https://sepolia.explorer.zora.energy',
    chainId: 999999,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://sepolia.explorer.zora.energy/api'
    }
  },
  // Polygon Amoy Testnet
  {
    id: 'polygon-amoy',
    name: 'Polygon Amoy',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorerUrl: 'https://amoy.polygonscan.com',
    chainId: 80002,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-amoy.polygonscan.com/api'
    }
  },
  // zkSync Mainnet
  {
    id: 'zksync-mainnet',
    name: 'zkSync',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://mainnet.era.zksync.io',
    explorerUrl: 'https://explorer.zksync.io',
    chainId: 324,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.explorer.zksync.io/api'
    }
  },
  // zkSync Sepolia Testnet
  {
    id: 'zksync-sepolia',
    name: 'zkSync Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://sepolia.era.zksync.dev',
    explorerUrl: 'https://sepolia.explorer.zksync.io',
    chainId: 300,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-sepolia.explorer.zksync.io/api'
    }
  },
  // Scroll Mainnet
  {
    id: 'scroll-mainnet',
    name: 'Scroll',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.scroll.io',
    explorerUrl: 'https://scrollscan.com',
    chainId: 534352,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.scrollscan.com/api'
    }
  },
  // Scroll Sepolia Testnet
  {
    id: 'scroll-sepolia',
    name: 'Scroll Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://sepolia-rpc.scroll.io',
    explorerUrl: 'https://sepolia.scrollscan.com',
    chainId: 534351,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-sepolia.scrollscan.com/api'
    }
  },
  // Linea Mainnet
  {
    id: 'linea-mainnet',
    name: 'Linea',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.linea.build',
    explorerUrl: 'https://lineascan.build',
    chainId: 59144,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.lineascan.build/api'
    }
  },
  // Linea Sepolia Testnet
  {
    id: 'linea-sepolia',
    name: 'Linea Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.sepolia.linea.build',
    explorerUrl: 'https://sepolia.lineascan.build',
    chainId: 59141,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-sepolia.lineascan.build/api'
    }
  },
  // Ethereum Mainnet
  {
    id: 'ethereum-mainnet',
    name: 'Ethereum',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.ankr.com/eth',
    explorerUrl: 'https://etherscan.io',
    chainId: 1,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.etherscan.io/api'
    }
  },
  // Lisk Mainnet
  {
    id: 'lisk-mainnet',
    name: 'Lisk',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.api.lisk.com',
    explorerUrl: 'https://blockscout.lisk.com',
    chainId: 1135,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://blockscout.lisk.com/api'
    }
  },
  // Lisk Sepolia Testnet
  {
    id: 'lisk-sepolia',
    name: 'Lisk Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.sepolia-api.lisk.com',
    explorerUrl: 'https://sepolia-blockscout.lisk.com',
    chainId: 4202,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://sepolia-blockscout.lisk.com/api'
    }
  },
  // Blast Mainnet
  {
    id: 'blast-mainnet',
    name: 'Blast',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.blast.io',
    explorerUrl: 'https://blastscan.io',
    chainId: 81457,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.blastscan.io/api'
    }
  },
  // Blast Sepolia Testnet
  {
    id: 'blast-sepolia',
    name: 'Blast Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://sepolia.blast.io',
    explorerUrl: 'https://sepolia.blastscan.io',
    chainId: 168587773,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-sepolia.blastscan.io/api'
    }
  },
  // Mode Mainnet
  {
    id: 'mode-mainnet',
    name: 'Mode',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://mainnet.mode.network',
    explorerUrl: 'https://explorer.mode.network',
    chainId: 34443,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.explorer.mode.network/api'
    }
  },
  // Mode Sepolia Testnet
  {
    id: 'mode-sepolia',
    name: 'Mode Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://sepolia.mode.network',
    explorerUrl: 'https://sepolia.explorer.mode.network',
    chainId: 919,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.sepolia.explorer.mode.network/api'
    }
  },
  // Manta Pacific Mainnet
  {
    id: 'manta-pacific',
    name: 'Manta Pacific',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://pacific-rpc.manta.network/http',
    explorerUrl: 'https://pacific-explorer.manta.network',
    chainId: 169,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://pacific-explorer.manta.network/api'
    }
  },
  // Manta Pacific Sepolia Testnet
  {
    id: 'manta-sepolia',
    name: 'Manta Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://pacific-rpc.sepolia-testnet.manta.network/http',
    explorerUrl: 'https://pacific-explorer.sepolia-testnet.manta.network',
    chainId: 3441006,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://pacific-explorer.sepolia-testnet.manta.network/api'
    }
  },
  // Metis Andromeda Mainnet
  {
    id: 'metis-mainnet',
    name: 'Metis',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://andromeda.metis.io/?owner=1088',
    explorerUrl: 'https://andromeda-explorer.metis.io',
    chainId: 1088,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://andromeda-explorer.metis.io/api'
    }
  },
  // Metis Sepolia Testnet
  {
    id: 'metis-sepolia',
    name: 'Metis Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://sepolia.metis.io/?owner=588',
    explorerUrl: 'https://sepolia-explorer.metis.io',
    chainId: 59902,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://sepolia-explorer.metis.io/api'
    }
  },
  // Mantle Mainnet
  {
    id: 'mantle-mainnet',
    name: 'Mantle',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.mantle.xyz',
    explorerUrl: 'https://explorer.mantle.xyz',
    chainId: 5000,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://explorer.mantle.xyz/api'
    }
  },
  // Mantle Sepolia Testnet
  {
    id: 'mantle-sepolia',
    name: 'Mantle Sepolia',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.sepolia.mantle.xyz',
    explorerUrl: 'https://explorer.sepolia.mantle.xyz',
    chainId: 5003,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://explorer.sepolia.mantle.xyz/api'
    }
  },
  // BNB Smart Chain Mainnet
  {
    id: 'bsc-mainnet',
    name: 'BNB Smart Chain',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    chainId: 56,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.bscscan.com/api'
    }
  },
  // BNB Smart Chain Testnet
  {
    id: 'bsc-testnet',
    name: 'BNB Smart Chain Testnet',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerUrl: 'https://testnet.bscscan.com',
    chainId: 97,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-testnet.bscscan.com/api'
    }
  },
  // Avalanche C-Chain
  {
    id: 'avalanche-mainnet',
    name: 'Avalanche',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    chainId: 43114,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.snowtrace.io/api'
    }
  },
  // Avalanche Fuji Testnet
  {
    id: 'avalanche-fuji',
    name: 'Avalanche Fuji',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    chainId: 43113,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-testnet.snowtrace.io/api'
    }
  },
  // Fantom Mainnet
  {
    id: 'fantom-mainnet',
    name: 'Fantom',
    type: 'ethereum',
    environment: 'mainnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.ftm.tools',
    explorerUrl: 'https://ftmscan.com',
    chainId: 250,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api.ftmscan.com/api'
    }
  },
  // Fantom Testnet
  {
    id: 'fantom-testnet',
    name: 'Fantom Testnet',
    type: 'ethereum',
    environment: 'testnet',
    isEnabled: true,
    rpcUrl: 'https://rpc.testnet.fantom.network',
    explorerUrl: 'https://testnet.ftmscan.com',
    chainId: 4002,
    ethereumConfig: {
      blockExplorerApiUrl: 'https://api-testnet.ftmscan.com/api'
    }
  }
];

/**
 * Network Registry manages the available blockchain networks
 */
class NetworkRegistry {
  private networks: Map<string, NetworkConfig> = new Map();
  private _activeNetworkId: string | null = null;
  
  constructor() {
    // Load default networks
    this.initializeDefaultNetworks();
    
    // Set the default active network to Hedera Testnet
    this._activeNetworkId = 'hedera-testnet';
  }
  
  /**
   * Initialize with default networks
   */
  private initializeDefaultNetworks(): void {
    DEFAULT_NETWORKS.forEach(network => {
      this.networks.set(network.id, this.applyEnvironmentOverrides(network));
    });
  }
  
  /**
   * Apply any environment variable overrides to the network configuration
   */
  private applyEnvironmentOverrides(network: NetworkConfig): NetworkConfig {
    const updatedNetwork = { ...network };
    
    // Apply Hedera-specific overrides
    if (network.type === 'hedera' && network.hederaConfig) {
      if (network.id === 'hedera-testnet') {
        // Override with environment variables if available
        updatedNetwork.hederaConfig = {
          ...network.hederaConfig,
          operatorId: process.env.HEDERA_OPERATOR_ID,
          operatorKey: process.env.HEDERA_OPERATOR_KEY,
          mirrorNodeUrl: process.env.HEDERA_MIRROR_NODE_URL || network.hederaConfig.mirrorNodeUrl
        };
        updatedNetwork.rpcUrl = process.env.HEDERA_RPC_URL || network.rpcUrl;
      }
    }
    
    // Apply Ethereum-specific overrides
    if (network.type === 'ethereum' && network.ethereumConfig) {
      if (network.id === 'ethereum-sepolia') {
        updatedNetwork.rpcUrl = process.env.SEPOLIA_RPC_URL || network.rpcUrl;
        if (network.ethereumConfig) {
          updatedNetwork.ethereumConfig = {
            ...network.ethereumConfig,
            apiKey: process.env.ETHERSCAN_API_KEY
          };
        }
      } else if (network.id === 'ethereum-goerli') {
        updatedNetwork.rpcUrl = process.env.GOERLI_RPC_URL || network.rpcUrl;
        if (network.ethereumConfig) {
          updatedNetwork.ethereumConfig = {
            ...network.ethereumConfig,
            apiKey: process.env.ETHERSCAN_API_KEY
          };
        }
      }
    }
    
    return updatedNetwork;
  }
  
  /**
   * Get all networks
   */
  public getAllNetworks(): NetworkConfig[] {
    return Array.from(this.networks.values());
  }
  
  /**
   * Get a specific network by ID
   */
  public getNetwork(id: string): NetworkConfig | undefined {
    return this.networks.get(id);
  }
  
  /**
   * Get networks by type
   */
  public getNetworksByType(type: NetworkType): NetworkConfig[] {
    return this.getAllNetworks().filter(network => network.type === type);
  }
  
  /**
   * Get networks by environment
   */
  public getNetworksByEnvironment(environment: NetworkEnvironment): NetworkConfig[] {
    return this.getAllNetworks().filter(network => network.environment === environment);
  }
  
  /**
   * Add a custom network
   */
  public addNetwork(network: NetworkConfig): void {
    this.networks.set(network.id, network);
  }
  
  /**
   * Update an existing network
   */
  public updateNetwork(id: string, updates: Partial<NetworkConfig>): NetworkConfig | undefined {
    const network = this.networks.get(id);
    if (!network) return undefined;
    
    const updatedNetwork = { ...network, ...updates };
    this.networks.set(id, updatedNetwork);
    return updatedNetwork;
  }
  
  /**
   * Remove a network
   */
  public removeNetwork(id: string): boolean {
    if (this._activeNetworkId === id) {
      // Can't remove the active network
      return false;
    }
    return this.networks.delete(id);
  }
  
  /**
   * Set the active network
   */
  public setActiveNetwork(id: string): boolean {
    if (!this.networks.has(id)) return false;
    this._activeNetworkId = id;
    return true;
  }
  
  /**
   * Get the active network
   */
  public getActiveNetwork(): NetworkConfig | undefined {
    if (!this._activeNetworkId) return undefined;
    return this.networks.get(this._activeNetworkId);
  }
  
  /**
   * Get the active network ID
   */
  public get activeNetworkId(): string | null {
    return this._activeNetworkId;
  }
}

// Create singleton instance
export const networkRegistry = new NetworkRegistry();

export default networkRegistry; 