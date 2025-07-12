import { Abi } from 'viem';
import { useCallback, useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';

interface WriteState {
  isWriting: boolean;
  txHash?: `0x${string}`;
  receipt?: any;
  error?: Error;
}

export function useContractWriter() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [state, setState] = useState<WriteState>({ isWriting: false });

  const write = useCallback(async (
    address: `0x${string}`,
    abi: Abi,
    functionName: string,
    args: any[] = [],
    value?: bigint
  ) => {
    if (!walletClient) throw new Error('Wallet not connected');
    if (!publicClient) throw new Error('No public client');
    try {
      setState({ isWriting: true });
      const hash = await walletClient.writeContract({
        address,
        abi,
        functionName,
        args,
        value,
      } as any);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setState({ isWriting: false, txHash: hash, receipt });
      return receipt;
    } catch (error: any) {
      setState({ isWriting: false, error });
      throw error;
    }
  }, [walletClient, publicClient]);

  return { ...state, write };
} 