import { Abi } from 'viem';
import { useCallback, useState } from 'react';
import { usePublicClient } from 'wagmi';

interface ReadState<T = any> {
  isReading: boolean;
  data?: T;
  error?: Error;
}

export function useContractReader() {
  const publicClient = usePublicClient();
  const [state, setState] = useState<ReadState>({ isReading: false });

  const read = useCallback(async <T = any>(
    address: `0x${string}`,
    abi: Abi,
    functionName: string,
    args: any[] = []
  ): Promise<T> => {
    if (!publicClient) throw new Error('No public client');
    try {
      setState({ isReading: true });
      const result = await publicClient.readContract({
        address,
        abi,
        functionName,
        args,
      } as any);
      setState({ isReading: false, data: result });
      return result as T;
    } catch (error: any) {
      setState({ isReading: false, error });
      throw error;
    }
  }, [publicClient]);

  return { ...state, read };
} 