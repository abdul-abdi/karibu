'use client';

import React, { useEffect, useState } from 'react';
import { validateEnvironment } from '../../app/utils/validateEnv';
import { checkEnvironmentSetup, logNetworkStatus } from '../../app/utils/helpers';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider } from 'wagmi';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base, zora, arbitrumSepolia, optimismSepolia, baseSepolia, zoraSepolia, zkSync, scroll, scrollSepolia, linea, lineaSepolia, polygonAmoy, blast, blastSepolia, mode, mantle, mantleSepoliaTestnet, metis, metisGoerli, bsc, bscTestnet, avalanche, avalancheFuji, fantom, fantomTestnet, lisk, liskSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { networkService } from '../../app/utils/networks/network-service';
import networkRegistry from '../../app/utils/networks/network-registry';

interface AppProviderProps {
  children: React.ReactNode;
}

// Network sync component that runs inside the WagmiProvider
function NetworkSync() {
  const chainId = useChainId();

  useEffect(() => {
    const syncNetwork = async () => {
      try {
        if (chainId) {
          // Find the matching network in our registry
          const networks = networkRegistry.getAllNetworks();
          const network = networks.find(n => n.chainId === chainId);
          
          if (network) {
            // Sync our network service with RainbowKit's selection
            console.log(`Syncing network service to: ${network.name} (Chain ID: ${chainId})`);
            
            try {
              await networkService.changeNetwork(network.id);
              console.log(`Successfully synced to network: ${network.name}`);
            } catch (networkError) {
              console.warn(`Failed to initialize network ${network.name}:`, networkError);
              // Don't throw error, just log it - the app can still function
            }
          } else {
            console.warn(`No matching network found for chain ID: ${chainId}`);
          }
        }
      } catch (error) {
        console.error('Error in NetworkSync:', error);
        // Don't throw error - allow the app to continue running
      }
    };

    syncNetwork();
  }, [chainId]);

  return null; // This component only handles side effects
}

export function AppProvider({ children }: AppProviderProps) {
  const [envChecked, setEnvChecked] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);
  const [envInstructions, setEnvInstructions] = useState<string | null>(null);

  // Query client instance (memoised)
  const queryClient = useMemo(() => new QueryClient(), []);

  // Get WalletConnect Project ID with validation
  const walletConnectProjectId = useMemo(() => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    
    // Check if it's a valid project ID (not demo or empty)
    if (!projectId || projectId === 'demo' || projectId.includes('YOUR_PROJECT_ID')) {
      console.warn('WalletConnect Project ID is missing or invalid. Some wallet features may not work properly.');
      console.warn('Please get a valid Project ID from: https://cloud.walletconnect.com/');
      return 'demo'; // Fallback to demo for basic functionality
    }
    
    return projectId;
  }, []);

  // Wagmi/RainbowKit config with standard chains (Hedera handled separately)
  const wagmiConfig = useMemo(() => {
    try {
      return getDefaultConfig({
        appName: 'Karibu',
        projectId: walletConnectProjectId,
        chains: [
          // Ethereum networks - these are well-supported by Wagmi
          mainnet, 
          polygon, 
          optimism, 
          arbitrum, 
          base, 
          zora, 
          arbitrumSepolia, 
          optimismSepolia, 
          baseSepolia, 
          zoraSepolia, 
          zkSync, 
          scroll, 
          scrollSepolia, 
          linea, 
          lineaSepolia, 
          polygonAmoy, 
          blast, 
          blastSepolia, 
          mode, 
          mantle, 
          mantleSepoliaTestnet, 
          metis, 
          metisGoerli, 
          bsc, 
          bscTestnet, 
          avalanche, 
          avalancheFuji, 
          fantom, 
          fantomTestnet, 
          lisk, 
          liskSepolia
        ],
        ssr: true,
        // Note: Hedera networks are handled separately through our network service
      });
    } catch (error) {
      console.error('Failed to initialize WalletConnect config:', error);
      // Return a minimal config with only Ethereum mainnet as last resort
      return getDefaultConfig({
        appName: 'Karibu',
        projectId: 'demo',
        chains: [mainnet],
        ssr: true,
      });
    }
  }, [walletConnectProjectId]);

  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV === 'development') {
      try {
        // Log network configuration status
        logNetworkStatus();
        
        // Check environment setup
        const envSetup = checkEnvironmentSetup();
        
        // Check WalletConnect configuration
        if (walletConnectProjectId === 'demo') {
          setEnvError('WalletConnect Project ID not configured');
          setEnvInstructions(`
To fix WalletConnect connection issues:

1. Go to https://cloud.walletconnect.com/
2. Create a new project
3. Copy your Project ID
4. Add to your .env.local file:
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id

Without a valid Project ID, you may experience:
- Connection timeouts
- "Connection interrupted while trying to subscribe" errors
- Unstable wallet connections
          `);
        } else {
          setEnvChecked(true);
        }
        
        /*
        // Skip other validation for now since deployment is working
        if (!envSetup.hasValidCredentials) {
          setEnvError('Missing or invalid blockchain credentials');
          setEnvInstructions(envSetup.instructions);
        } else {
          // Validate environment
          validateEnvironment();
          console.log('Environment validation passed');
        }
        */
      } catch (error: any) {
        console.error('Environment validation failed:', error.message);
        setEnvError(error.message);
      } finally {
        setEnvChecked(true);
      }
    } else {
      // In production, assume the server has already validated
      setEnvChecked(true);
    }
  }, [walletConnectProjectId]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <NetworkSync />
          {process.env.NODE_ENV === 'development' && envError && (
            <div className="bg-red-500 text-white px-4 py-3 text-center">
              <p className="font-bold">{envError}</p>
              {envInstructions && (
                <details className="mt-2 text-left bg-red-400/20 p-4 rounded max-w-3xl mx-auto">
                  <summary className="cursor-pointer font-medium mb-2">How to fix this</summary>
                  <pre className="whitespace-pre-wrap text-xs bg-black/20 p-3 rounded">
                    {envInstructions}
                  </pre>
                </details>
              )}
            </div>
          )}
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 