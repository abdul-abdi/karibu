/**
 * Network types for blockchain networks
 */

/**
 * Supported blockchain network types
 */
export type NetworkType = 'hedera' | 'ethereum';

/**
 * Supported network environments
 */
export type NetworkEnvironment = 'testnet' | 'mainnet';

/**
 * Network configuration interface
 */
export interface NetworkConfig {
  id: string;
  name: string;
  type: NetworkType;
  environment: NetworkEnvironment;
  isEnabled: boolean;
  
  // JSON-RPC endpoint for the network
  rpcUrl: string;
  
  // Block explorer URL
  explorerUrl: string;
  
  // Chain ID for EVM networks
  chainId?: number;
  
  // Hedera-specific configurations
  hederaConfig?: {
    mirrorNodeUrl: string;
    operatorId?: string;
    operatorKey?: string;
  };
  
  // Ethereum-specific configurations
  ethereumConfig?: {
    blockExplorerApiUrl?: string;
    apiKey?: string;
  };
}

/**
 * Network connection status
 */
export enum NetworkStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
} 