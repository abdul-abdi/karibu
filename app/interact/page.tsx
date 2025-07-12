'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useChainId, useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  ExternalLink, 
  Code, 
  Zap, 
  Shield, 
  Globe, 
  ArrowRight, 
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Wifi,
  History,
  HelpCircle
} from 'lucide-react';
import { networkService } from '@/app/utils/networks/network-service';
import { useToast } from '@/components/providers/toast-provider';

export default function InteractPage() {
  const router = useRouter();
  const { toast } = useToast();
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const [contractAddress, setContractAddress] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<any>(null);
  const [recentContracts, setRecentContracts] = useState<any[]>([]);
  const [validationError, setValidationError] = useState('');

  // Monitor network changes from RainbowKit
  useEffect(() => {
    const updateCurrentNetwork = async () => {
      try {
        await networkService.initialize();
        const activeNetwork = networkService.getActiveNetwork();
        setCurrentNetwork(activeNetwork);
      } catch (error) {
        console.error('Error getting active network:', error);
      }
    };

    updateCurrentNetwork();
  }, [chainId]); // Re-run when chainId changes from RainbowKit

  // Load recent contracts from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('karibu-recent-contracts');
    if (recent) {
      try {
        setRecentContracts(JSON.parse(recent));
      } catch (error) {
        console.error('Error parsing recent contracts:', error);
      }
    }
  }, []);

  const isValidAddress = (address: string) => {
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleAddressChange = (value: string) => {
    setContractAddress(value);
    setValidationError('');
    
    if (value && !isValidAddress(value)) {
      setValidationError('Invalid contract address format');
    }
  };

  const handleInteract = async () => {
    if (!contractAddress || !isValidAddress(contractAddress)) {
      setValidationError('Please enter a valid contract address');
      return;
    }

    if (!isConnected) {
      setValidationError('Please connect your wallet first');
      return;
    }

    if (!currentNetwork) {
      setValidationError('Please select a network from the navbar');
      return;
    }

    setIsValidating(true);
    
    try {
      // Save to recent contracts
      const newContract = {
        address: contractAddress,
        network: currentNetwork.id,
        networkName: currentNetwork.name,
        timestamp: Date.now()
      };

      const updatedRecent = [newContract, ...recentContracts.slice(0, 9)];
      setRecentContracts(updatedRecent);
      localStorage.setItem('karibu-recent-contracts', JSON.stringify(updatedRecent));

      // Navigate to contract interaction page
      router.push(`/interact/${contractAddress}?network=${currentNetwork.id}`);
    } catch (error) {
      console.error('Error navigating to contract:', error);
      toast({
        title: 'Navigation Error',
        description: 'Failed to navigate to contract page',
        type: 'error'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleRecentContractClick = (contract: any) => {
    setContractAddress(contract.address);
    // Navigate directly since we don't need to change networks manually anymore
    router.push(`/interact/${contract.address}?network=${contract.network}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-indigo-500">
            Interact with Smart Contracts
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Connect to any smart contract on supported networks. Use the network switcher in the navbar to select your network.
          </p>
        </motion.div>

        {/* Main Split Layout */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          
          {/* Left Side - Main Interaction */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Primary Interaction Card */}
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-6 w-6 text-primary" />
                  Contract Interaction
                </CardTitle>
                <CardDescription>
                  Enter a contract address to start interacting with the smart contract
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Network Display - Only show when wallet is connected */}
                {isConnected && currentNetwork && (
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Connected to:</span>
                      <Badge variant="secondary" className="gap-1">
                        <Globe className="h-3 w-3" />
                        {currentNetwork.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the network switcher in the navbar to change networks
                    </p>
                  </div>
                )}

                {!isConnected && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please connect your wallet using the "Connect Wallet" button in the navbar to interact with contracts.
                    </AlertDescription>
                  </Alert>
                )}

                {isConnected && !currentNetwork && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please select a network from the navbar to interact with contracts.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Contract Address Input */}
                <div className="space-y-2">
                  <Label htmlFor="address">Contract Address</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      value={contractAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      placeholder="0x742d35cc6634C0532925a3b8D400bB7A4f81b863"
                      className={validationError ? 'border-red-500' : ''}
                    />
                    <Button 
                      onClick={handleInteract}
                      disabled={isValidating || !contractAddress || !isConnected || !currentNetwork || !!validationError}
                      className="px-6"
                    >
                      {isValidating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Search className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <>
                          <span className="hidden sm:inline">Interact</span>
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                  {validationError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{validationError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-primary" />
                  Platform Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <Zap className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Real-time Functions</p>
                      <p className="text-xs text-muted-foreground">Execute contract functions instantly</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <Shield className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Secure Interactions</p>
                      <p className="text-xs text-muted-foreground">Safe transaction handling</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="p-2 rounded-full bg-purple-500/10">
                      <FileText className="h-4 w-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">ABI Detection</p>
                      <p className="text-xs text-muted-foreground">Automatic interface discovery</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Side - History & Help */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Recent Contracts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Recent Contracts
                  {recentContracts.length > 0 && (
                    <Badge variant="secondary">{recentContracts.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {recentContracts.length > 0 
                    ? "Quickly access contracts you've interacted with recently"
                    : "No recent contracts yet. Start by entering a contract address."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentContracts.length > 0 ? (
                  <div className="grid gap-3 max-h-80 overflow-y-auto">
                    {recentContracts.slice(0, 8).map((contract, index) => (
                      <motion.div
                        key={`${contract.address}-${contract.network}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors group"
                        onClick={() => handleRecentContractClick(contract)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Code className="h-3 w-3 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-sm truncate">{contract.address}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {contract.networkName || contract.network}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(contract.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent contracts</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Help Section */}
            <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <HelpCircle className="h-5 w-5" />
                  How to Get Started
                </CardTitle>
              </CardHeader>
              <CardContent className="text-blue-600 dark:text-blue-200">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-blue-500/20 mt-0.5">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Connect Your Wallet</p>
                      <p className="text-xs text-blue-500 dark:text-blue-300">Use the connect button in the navbar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-blue-500/20 mt-0.5">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Select Network</p>
                      <p className="text-xs text-blue-500 dark:text-blue-300">Choose your network from the navbar switcher</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-blue-500/20 mt-0.5">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Enter Contract Address</p>
                      <p className="text-xs text-blue-500 dark:text-blue-300">Paste the contract address (starts with 0x)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-blue-500/20 mt-0.5">
                      <CheckCircle className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Start Interacting</p>
                      <p className="text-xs text-blue-500 dark:text-blue-300">Click interact to view functions and execute transactions</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Tips */}
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-lg">
                  <CheckCircle className="h-5 w-5" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="text-amber-600 dark:text-amber-200">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-500" />
                    Automatic ABI detection and parsing
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-500" />
                    Read contract state variables instantly
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-500" />
                    Execute functions with real-time feedback
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-500" />
                    View transaction history and results
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 