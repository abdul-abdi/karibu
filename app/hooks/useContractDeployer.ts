import { useState, useCallback } from 'react';
import { Abi } from 'viem';
import { useWalletClient, usePublicClient } from 'wagmi';

interface DeployOptions {
  abi: Abi;
  bytecode: `0x${string}`;
  args?: any[];
  chainId?: number;
  gas?: bigint;
  value?: bigint;
}

interface DeployState {
  isDeploying: boolean;
  txHash?: `0x${string}`;
  contractAddress?: `0x${string}`;
  error?: Error;
}

export function useContractDeployer() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [state, setState] = useState<DeployState>({ isDeploying: false });

  const deploy = useCallback(async (opts: DeployOptions) => {
    if (!walletClient) throw new Error('Wallet not connected');
    if (!publicClient) throw new Error('No public client');

    try {
      setState({ isDeploying: true });
      const hash = await walletClient.deployContract({
        abi: opts.abi,
        bytecode: opts.bytecode,
        args: opts.args || [],
        value: opts.value,
        chain: opts.chainId ? undefined : undefined, // optional override
        gas: opts.gas,
      } as any);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setState({ isDeploying: false, txHash: hash, contractAddress: receipt.contractAddress as `0x${string}` });
      return receipt.contractAddress as `0x${string}`;
    } catch (error: any) {
      setState({ isDeploying: false, error });
      throw error;
    }
  }, [walletClient, publicClient]);

  return { ...state, deploy };
} 