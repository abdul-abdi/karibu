import { NetworkAdapter } from './network-adapter';
import { NetworkFactory } from './network-factory';
import networkRegistry from './network-registry';
import { NetworkConfig, NetworkStatus } from '../../types/network';

/**
 * Network service for managing blockchain network connections
 */
export class NetworkService {
  private static instance: NetworkService;
  private initialized: boolean = false;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }
  
  /**
   * Initialize the network service
   * @param defaultNetworkId Optional default network ID to use
   */
  public async initialize(defaultNetworkId?: string): Promise<boolean> {
    try {
      if (this.initialized) {
        return true;
      }
      
      console.log('Initializing network service...');
      
      // Set default network from environment or parameter
      const envDefaultNetwork = process.env.DEFAULT_NETWORK;
      const networkId = defaultNetworkId || envDefaultNetwork || 'hedera-testnet';
      
      // Set active network
      if (networkRegistry.getNetwork(networkId)) {
        networkRegistry.setActiveNetwork(networkId);
        console.log(`Set active network to: ${networkId}`);
      } else {
        console.warn(`Default network ${networkId} not found, using first available network`);
        const networks = networkRegistry.getAllNetworks();
        if (networks.length > 0) {
          networkRegistry.setActiveNetwork(networks[0].id);
          console.log(`Set active network to: ${networks[0].id}`);
        } else {
          console.error('No networks available');
          return false;
        }
      }
      
      // Initialize active network adapter
      const activeAdapter = NetworkFactory.getActiveAdapter();
      if (activeAdapter) {
        const success = await activeAdapter.initialize();
        if (success) {
          console.log(`Successfully initialized active network: ${networkRegistry.activeNetworkId}`);
        } else {
          console.error(`Failed to initialize active network: ${networkRegistry.activeNetworkId}`);
          return false;
        }
      } else {
        console.error('Failed to get active network adapter');
        return false;
      }
      
      this.initialized = true;
      console.log('Network service initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing network service:', error);
      return false;
    }
  }
  
  /**
   * Get all available networks
   */
  public getAllNetworks(): NetworkConfig[] {
    return networkRegistry.getAllNetworks();
  }
  
  /**
   * Get current active network
   */
  public getActiveNetwork(): NetworkConfig | undefined {
    return networkRegistry.getActiveNetwork();
  }
  
  /**
   * Change the active network
   * @param networkId Network ID to switch to
   */
  public async changeNetwork(networkId: string): Promise<boolean> {
    try {
      console.log(`Changing network to: ${networkId}`);
      
      // Get network configuration
      const networkConfig = networkRegistry.getNetwork(networkId);
      if (!networkConfig) {
        const errorMsg = `Network ${networkId} not found in registry`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // Set active network in registry
      networkRegistry.setActiveNetwork(networkId);
      console.log(`Set active network to: ${networkId}`);
      
      try {
        // Get and initialize network adapter
        const adapter = NetworkFactory.getAdapter(networkId);
        if (adapter) {
          const success = await adapter.initialize();
          if (success) {
            console.log(`Successfully initialized network: ${networkId}`);
            return true;
          } else {
            console.warn(`Failed to initialize network ${networkId}, but continuing with limited functionality`);
            // Don't throw error - allow app to continue with limited functionality
            return false;
          }
        } else {
          console.warn(`Failed to get adapter for network ${networkId}`);
          return false;
        }
      } catch (adapterError) {
        console.warn(`Error initializing network adapter for ${networkId}:`, adapterError);
        // Don't throw error - allow app to continue
        return false;
      }
    } catch (error: any) {
      const errorMsg = `Failed to initialize network ${networkId}`;
      console.error(errorMsg, error);
      
      // Try to fallback to a working network
      if (networkId !== 'hedera-testnet') {
        console.log('Attempting to fallback to hedera-testnet...');
        try {
          return await this.changeNetwork('hedera-testnet');
        } catch (fallbackError) {
          console.error('Fallback to hedera-testnet also failed:', fallbackError);
        }
      }
      
      // Don't throw error - allow app to continue with limited functionality
      return false;
    }
  }
  
  /**
   * Get the active network adapter
   */
  public getAdapter(): NetworkAdapter | null {
    return NetworkFactory.getActiveAdapter();
  }
  
  /**
   * Get adapter for a specific network
   * @param networkId Network ID
   */
  public getAdapterForNetwork(networkId: string): NetworkAdapter | null {
    return NetworkFactory.getAdapter(networkId);
  }
  
  /**
   * Check if the service is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const networkService = NetworkService.getInstance();

export default networkService; 