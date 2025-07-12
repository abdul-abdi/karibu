'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft,
  Copy,
  ExternalLink,
  Code,
  Play,
  Eye,
  Edit,
  Database,
  Network,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  FileText,
  Zap,
  Shield
} from 'lucide-react';
import { networkService } from '@/app/utils/networks/network-service';
import { fetchContractAbi } from '@/app/utils/contract-api-service';
import { useToast } from '@/components/providers/toast-provider';
import { ContractFunction } from '@/app/types/contract';
import ContractFunctionComponent from '@/app/interact/components/ContractFunction';
import ContractInfo from '@/app/interact/components/ContractInfo';
import ABIViewer from '@/app/interact/components/ABIViewer';

interface ContractData {
  address: string;
  abi: ContractFunction[];
  networkId: string;
  networkName: string;
  explorerUrl: string;
}

export default function ContractPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const contractAddress = params.contractAddress as string;
  const networkId = searchParams.get('network') || '';

  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('functions');
  const [functionResults, setFunctionResults] = useState<Record<string, any>>({});
  const [loadingFunctions, setLoadingFunctions] = useState<Set<string>>(new Set());

  // Load contract data
  const loadContractData = useCallback(async () => {
    if (!contractAddress || !networkId) {
      setError('Missing contract address or network');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Switch to the specified network
      await networkService.changeNetwork(networkId);
      const network = networkService.getActiveNetwork();
      
      if (!network) {
        throw new Error('Failed to get network information');
      }

      // Fetch contract ABI
      console.log(`Fetching ABI for contract ${contractAddress} on network ${networkId}`);
      const abi = await fetchContractAbi(contractAddress, {
        networkId,
        forceRefresh: true,
        preferSource: true,
        bypassCache: true
      });

      if (!abi || abi.length === 0) {
        throw new Error('No ABI found for this contract. The contract might not be verified or deployed.');
      }

      // Get explorer URL
      const adapter = networkService.getAdapter();
      const explorerUrl = adapter ? adapter.getExplorerUrl('address', contractAddress) : '#';

      setContractData({
        address: contractAddress,
        abi,
        networkId,
        networkName: network.name,
        explorerUrl
      });

      // Save to recent contracts
      const recentContract = {
        address: contractAddress,
        network: networkId,
        timestamp: Date.now()
      };

      const recent = localStorage.getItem('karibu-recent-contracts');
      const recentContracts = recent ? JSON.parse(recent) : [];
      const updatedRecent = [recentContract, ...recentContracts.filter(
        (c: any) => c.address !== contractAddress || c.network !== networkId
      ).slice(0, 9)];
      
      localStorage.setItem('karibu-recent-contracts', JSON.stringify(updatedRecent));

    } catch (err: any) {
      console.error('Error loading contract data:', err);
      setError(err.message || 'Failed to load contract data');
      toast({
        title: 'Contract Load Error',
        description: err.message || 'Failed to load contract data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [contractAddress, networkId, toast]);

  // Load data on mount and when parameters change
  useEffect(() => {
    loadContractData();
  }, [loadContractData]);

  const handleFunctionResult = useCallback((functionName: string, result: any) => {
    setFunctionResults(prev => ({
      ...prev,
      [functionName]: result
    }));
  }, []);

  const handleFunctionLoading = useCallback((functionName: string, isLoading: boolean) => {
    setLoadingFunctions(prev => {
      const newSet = new Set(prev);
      if (isLoading) {
        newSet.add(functionName);
      } else {
        newSet.delete(functionName);
      }
      return newSet;
    });
  }, []);

  const copyAddress = useCallback(() => {
    navigator.clipboard.writeText(contractAddress);
    toast({
      title: 'Address Copied',
      description: 'Contract address copied to clipboard',
      type: 'success'
    });
  }, [contractAddress, toast]);

  const handleBack = useCallback(() => {
    router.push('/interact');
  }, [router]);

  const handleRefresh = useCallback(() => {
    loadContractData();
  }, [loadContractData]);

  // Filter functions by type
  const readFunctions = contractData?.abi.filter(func => 
    func.type === 'function' && 
    (func.stateMutability === 'view' || func.stateMutability === 'pure' || func.constant)
  ) || [];

  const writeFunctions = contractData?.abi.filter(func => 
    func.type === 'function' && 
    func.stateMutability !== 'view' && 
    func.stateMutability !== 'pure' && 
    !func.constant
  ) || [];

  const events = contractData?.abi.filter(func => func.type === 'event') || [];
  const constructor = contractData?.abi.find(func => func.type === 'constructor');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Interact
            </Button>
            
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="ml-4"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  if (!contractData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex-1">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-3xl font-bold"
              >
                Contract Interaction
              </motion.h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  <Network className="h-3 w-3 mr-1" />
                  {contractData.networkName}
                </Badge>
                <Badge variant="outline">
                  {contractData.abi.length} functions
                </Badge>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Contract Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <ContractInfo 
              address={contractData.address}
              networkName={contractData.networkName}
              explorerUrl={contractData.explorerUrl}
              abiLength={contractData.abi.length}
              onCopyAddress={copyAddress}
            />
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="functions" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Functions
                </TabsTrigger>
                <TabsTrigger value="read" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Read ({readFunctions.length})
                </TabsTrigger>
                <TabsTrigger value="write" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Write ({writeFunctions.length})
                </TabsTrigger>
                <TabsTrigger value="abi" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  ABI/Details
                </TabsTrigger>
              </TabsList>

              {/* All Functions Tab */}
              <TabsContent value="functions" className="space-y-4">
                <div className="grid gap-4">
                  {readFunctions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="h-5 w-5 text-blue-500" />
                          Read Functions
                          <Badge variant="secondary">{readFunctions.length}</Badge>
                        </CardTitle>
                        <CardDescription>
                          These functions read data from the contract without modifying state
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3">
                          {readFunctions.map((func, index) => (
                            <ContractFunctionComponent
                              key={`read-${func.name}-${index}`}
                              contractFunction={func}
                              contractAddress={contractData.address}
                              networkId={contractData.networkId}
                              onResult={handleFunctionResult}
                              onLoading={handleFunctionLoading}
                              isLoading={loadingFunctions.has(func.name)}
                              result={functionResults[func.name]}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {writeFunctions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Edit className="h-5 w-5 text-orange-500" />
                          Write Functions
                          <Badge variant="secondary">{writeFunctions.length}</Badge>
                        </CardTitle>
                        <CardDescription>
                          These functions modify the contract state and require gas
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3">
                          {writeFunctions.map((func, index) => (
                            <ContractFunctionComponent
                              key={`write-${func.name}-${index}`}
                              contractFunction={func}
                              contractAddress={contractData.address}
                              networkId={contractData.networkId}
                              onResult={handleFunctionResult}
                              onLoading={handleFunctionLoading}
                              isLoading={loadingFunctions.has(func.name)}
                              result={functionResults[func.name]}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Read Functions Tab */}
              <TabsContent value="read" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-500" />
                      Read Functions
                    </CardTitle>
                    <CardDescription>
                      Query contract state without spending gas. These functions are read-only.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {readFunctions.length > 0 ? (
                      <div className="grid gap-3">
                        {readFunctions.map((func, index) => (
                          <ContractFunctionComponent
                            key={`read-only-${func.name}-${index}`}
                            contractFunction={func}
                            contractAddress={contractData.address}
                            networkId={contractData.networkId}
                            onResult={handleFunctionResult}
                            onLoading={handleFunctionLoading}
                            isLoading={loadingFunctions.has(func.name)}
                            result={functionResults[func.name]}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No read functions found in this contract</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Write Functions Tab */}
              <TabsContent value="write" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Edit className="h-5 w-5 text-orange-500" />
                      Write Functions
                    </CardTitle>
                    <CardDescription>
                      Modify contract state. These functions require gas and may change blockchain data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {writeFunctions.length > 0 ? (
                      <div className="grid gap-3">
                        {writeFunctions.map((func, index) => (
                          <ContractFunctionComponent
                            key={`write-only-${func.name}-${index}`}
                            contractFunction={func}
                            contractAddress={contractData.address}
                            networkId={contractData.networkId}
                            onResult={handleFunctionResult}
                            onLoading={handleFunctionLoading}
                            isLoading={loadingFunctions.has(func.name)}
                            result={functionResults[func.name]}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No write functions found in this contract</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ABI/Details Tab */}
              <TabsContent value="abi">
                <ABIViewer 
                  abi={contractData.abi}
                  constructor={constructor}
                  events={events}
                  contractAddress={contractData.address}
                />
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 