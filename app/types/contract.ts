// Contract function input parameter
export interface FunctionInput {
  name: string;
  type: string;
  value: string;
}

// Contract function output parameter
export interface FunctionOutput {
  name?: string;
  type: string;
}

// Contract function definition
export interface ContractFunction {
  name: string;
  inputs: FunctionInput[];
  outputs: FunctionOutput[];
  stateMutability: string;
  type?: string;
  constant?: boolean;
  humanReadableSignature?: string;
  verified?: boolean;
  selector?: string;
}

// Compilation result
export interface CompilationResult {
  abi: ContractFunction[];
  bytecode: string;
  contractName: string;
  warnings: string[];
}

// Deployment result
export interface DeploymentResult {
  contractId: string;
  contractAddress: string;
  abi: ContractFunction[];
}

// Contract call result
export interface ContractCallResult {
  result: string | object;
  success?: boolean;
  transactionId?: string;
  gasUsed?: string;
  error?: string;
}

// Contract analysis result
export interface ContractAnalysisResult {
  analysis: string;
} 