import { NetworkConfig, NetworkStatus } from "../../types/network";

/**
 * Interface for blockchain operation results
 */
export interface BlockchainTransactionResult {
  success: boolean;
  transactionId?: string;
  transactionHash?: string;
  contractId?: string;
  contractAddress?: string;
  error?: string;
  explorerUrl?: string;
  gasUsed?: number | string;
  blockNumber?: number;
  receipt?: any;
  outputData?: any;
}

/**
 * Contract deployment parameters
 */
export interface DeploymentParams {
  bytecode: string;
  abi: any[];
  constructorArgs?: any[];
  deploymentId?: string;
  gasLimit?: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  value?: string;
}

/**
 * Contract call parameters
 */
export interface ContractCallParams {
  contractAddress: string;
  functionName: string;
  parameters?: any[];
  isQuery: boolean;
  abi?: any[];
  gasLimit?: number;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  value?: string;
}

/**
 * Interface for network-specific adapters
 */
export interface NetworkAdapter {
  /**
   * Get the network configuration
   */
  getConfig(): NetworkConfig;
  
  /**
   * Initialize the adapter with necessary configurations
   */
  initialize(): Promise<boolean>;
  
  /**
   * Get current network status
   */
  getStatus(): Promise<NetworkStatus>;
  
  /**
   * Deploy a smart contract
   */
  deployContract(params: DeploymentParams): Promise<BlockchainTransactionResult>;
  
  /**
   * Call a contract function (read or write)
   */
  callContract(params: ContractCallParams): Promise<BlockchainTransactionResult>;
  
  /**
   * Get contract bytecode from address
   */
  getContractBytecode(contractAddress: string): Promise<string>;
  
  /**
   * Get contract ABI from address (if available via explorer API)
   */
  getContractAbi(contractAddress: string): Promise<any[] | null>;
  
  /**
   * Format explorer URL for transaction
   */
  getExplorerUrl(type: 'transaction' | 'address' | 'block', hash: string): string;
  
  /**
   * Get the address format expected by this network
   */
  formatAddress(address: string): string;
  
  /**
   * Estimate gas for a contract deployment
   */
  estimateGas(params: DeploymentParams | ContractCallParams): Promise<number>;
  
  /**
   * Get current gas price
   */
  getGasPrice(): Promise<string>;
} 