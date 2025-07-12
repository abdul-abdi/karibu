import { NetworkConfig } from "../../types/network";
import { NetworkAdapter } from "./network-adapter";
import { HederaAdapter } from "./hedera-adapter";
import { EthereumAdapter } from "./ethereum-adapter";
import networkRegistry from "./network-registry";

/**
 * Network adapter factory
 * Creates the appropriate network adapter based on the network configuration
 */
export class NetworkFactory {
  private static adapters: Map<string, NetworkAdapter> = new Map();
  
  /**
   * Get a network adapter for the specified network ID
   * @param networkId Network ID to get adapter for
   * @returns Network adapter or null if network doesn't exist
   */
  static getAdapter(networkId: string): NetworkAdapter | null {
    // Check if we already have an adapter instance
    if (this.adapters.has(networkId)) {
      return this.adapters.get(networkId)!;
    }
    
    // Get network configuration
    const networkConfig = networkRegistry.getNetwork(networkId);
    if (!networkConfig) {
      console.error(`Network ${networkId} not found in registry`);
      return null;
    }
    
    // Create appropriate adapter
    const adapter = this.createAdapter(networkConfig);
    
    // Cache the adapter
    if (adapter) {
      this.adapters.set(networkId, adapter);
    }
    
    return adapter;
  }
  
  /**
   * Get the adapter for the active network
   * @returns Network adapter for the active network
   */
  static getActiveAdapter(): NetworkAdapter | null {
    const activeNetworkId = networkRegistry.activeNetworkId;
    if (!activeNetworkId) {
      console.error('No active network set');
      return null;
    }
    
    return this.getAdapter(activeNetworkId);
  }
  
  /**
   * Create a network adapter based on network type
   * @param networkConfig Network configuration
   * @returns Network adapter or null if type not supported
   */
  private static createAdapter(networkConfig: NetworkConfig): NetworkAdapter | null {
    switch (networkConfig.type) {
      case 'hedera':
        return new HederaAdapter(networkConfig);
      case 'ethereum':
        return new EthereumAdapter(networkConfig);
      default:
        console.error(`Unsupported network type: ${networkConfig.type}`);
        return null;
    }
  }
  
  /**
   * Initialize all network adapters
   * Useful for pre-warming the connections
   */
  static async initializeAllAdapters(): Promise<void> {
    // Clear adapter cache first
    this.adapters.clear();
    
    // Get all enabled networks
    const networks = networkRegistry.getAllNetworks()
      .filter(network => network.isEnabled);
    
    // Initialize adapters in parallel
    await Promise.all(networks.map(async network => {
      try {
        const adapter = this.createAdapter(network);
        if (adapter) {
          const initialized = await adapter.initialize();
          if (initialized) {
            this.adapters.set(network.id, adapter);
            console.log(`Initialized network adapter for ${network.name}`);
          } else {
            console.warn(`Failed to initialize network adapter for ${network.name}`);
          }
        }
      } catch (error) {
        console.error(`Error initializing adapter for ${network.name}:`, error);
      }
    }));
    
    console.log(`Initialized ${this.adapters.size} network adapters`);
  }
} 