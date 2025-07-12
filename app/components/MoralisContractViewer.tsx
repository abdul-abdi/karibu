/**
 * Enhanced Moralis Contract Viewer Component
 * Comprehensive interface showcasing Moralis API to its fullest potential
 */

'use client';

import React, { useState } from 'react';
import { useChainId, useAccount } from 'wagmi';
import { isAddress, formatEther } from 'viem';
import NextImage from 'next/image';
import { 
  useMoralisContract, 
  useMoralisConfig, 
  useMoralisTokenPrice,
  useMoralisWallet,
  useMoralisNFTCollection 
} from '../hooks/useMoralisContract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Copy, 
  Search, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  Image,
  Wallet,
  BarChart3,
  Info,
  Eye,
  Coins,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

export default function MoralisContractViewer() {
  const [contractAddress, setContractAddress] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { address: walletAddress } = useAccount();
  const chainId = useChainId();
  const { isChainSupported, supportedChains, clearCache } = useMoralisConfig();
  
  const { data: contractData, loading, error, refetch } = useMoralisContract(
    searchAddress,
    chainId,
    (data) => {
      toast.success(`Contract loaded: ${data.name || 'Unknown Contract'}`);
    },
    (error) => {
      toast.error(`Failed to load contract: ${error}`);
    }
  );

  const { data: priceData } = useMoralisTokenPrice(
    searchAddress && contractData?.contractType !== 'OTHER' ? searchAddress : '',
    chainId
  );

  const { data: walletData } = useMoralisWallet(walletAddress, chainId);
  const { data: nftCollection } = useMoralisNFTCollection(walletAddress, chainId);
  
  const handleSearch = () => {
    if (!contractAddress.trim()) {
      toast.error('Please enter a contract address');
      return;
    }
    
    if (!isAddress(contractAddress)) {
      toast.error('Invalid contract address format');
      return;
    }
    
    if (!isChainSupported) {
      toast.error(`Chain ${chainId} is not supported by Moralis`);
      return;
    }
    
    setSearchAddress(contractAddress);
  };
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatNumber = (num: number | string | undefined): string => {
    if (!num) return '0';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (numValue >= 1e9) return `${(numValue / 1e9).toFixed(2)}B`;
    if (numValue >= 1e6) return `${(numValue / 1e6).toFixed(2)}M`;
    if (numValue >= 1e3) return `${(numValue / 1e3).toFixed(2)}K`;
    return numValue.toFixed(2);
  };

  const formatPrice = (price: number | string | undefined): string => {
    if (!price) return '$0.00';
    const numValue = typeof price === 'string' ? parseFloat(price) : price;
    if (numValue < 0.01) return `$${numValue.toFixed(6)}`;
    return `$${numValue.toFixed(2)}`;
  };
  
  const getExplorerUrl = (address: string, chainId: number): string => {
    const explorers: { [key: number]: string } = {
      1: 'https://etherscan.io',
      11155111: 'https://sepolia.etherscan.io',
      137: 'https://polygonscan.com',
      80002: 'https://amoy.polygonscan.com',
      10: 'https://optimistic.etherscan.io',
      11155420: 'https://sepolia-optimistic.etherscan.io',
      42161: 'https://arbiscan.io',
      421614: 'https://sepolia.arbiscan.io',
      8453: 'https://basescan.org',
      84532: 'https://sepolia.basescan.org',
      56: 'https://bscscan.com',
      97: 'https://testnet.bscscan.com',
      43114: 'https://snowtrace.io',
      43113: 'https://testnet.snowtrace.io',
      250: 'https://ftmscan.com',
      4002: 'https://testnet.ftmscan.com',
    };
    
    const baseUrl = explorers[chainId];
    return baseUrl ? `${baseUrl}/address/${address}` : '';
  };
  
  const getChainName = (chainId: number): string => {
    const chainNames: { [key: number]: string } = {
      1: 'Ethereum',
      11155111: 'Sepolia',
      137: 'Polygon',
      80002: 'Polygon Amoy',
      10: 'Optimism',
      11155420: 'Optimism Sepolia',
      42161: 'Arbitrum One',
      421614: 'Arbitrum Sepolia',
      8453: 'Base',
      84532: 'Base Sepolia',
      56: 'BNB Smart Chain',
      97: 'BNB Testnet',
      43114: 'Avalanche',
      43113: 'Fuji Testnet',
      250: 'Fantom',
      4002: 'Fantom Testnet',
    };
    
    return chainNames[chainId] || `Chain ${chainId}`;
  };

  const renderContractTypeIcon = (type: string) => {
    switch (type) {
      case 'ERC20': return <Coins className="h-4 w-4" />;
      case 'ERC721': return <Image className="h-4 w-4" />;
      case 'ERC1155': return <Image className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Enhanced Contract Explorer</h1>
        <p className="text-muted-foreground">
          Powered by Moralis • Comprehensive blockchain data, NFTs, DeFi analytics, and more
        </p>
      </div>
      
      {/* Network Status & Wallet Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Network Status
              {isChainSupported ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{getChainName(chainId)}</p>
                <p className="text-sm text-muted-foreground">Chain ID: {chainId}</p>
              </div>
              <Badge variant={isChainSupported ? "default" : "destructive"}>
                {isChainSupported ? "Supported" : "Not Supported"}
              </Badge>
            </div>
            
            {!isChainSupported && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This network is not supported by Moralis. 
                  Supported chains: {supportedChains.join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Overview */}
        {walletAddress && walletData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Your Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Native Balance</span>
                  <span className="font-medium">
                    {formatNumber(parseFloat(formatEther(BigInt(walletData.nativeBalance || '0'))))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Token Count</span>
                  <span className="font-medium">{walletData.tokenBalances.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">NFT Count</span>
                  <span className="font-medium">{nftCollection?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Contract</CardTitle>
          <CardDescription>
            Enter a contract address to explore comprehensive blockchain data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading || !isChainSupported}
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { clearCache(); refetch(); }}
              size="sm"
            >
              Refresh
            </Button>
          </div>
          
          {/* Address Validation Indicator */}
          {contractAddress && (
            <div className="flex items-center gap-2 text-sm">
              {isAddress(contractAddress) ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-600">Valid address format</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-600">Invalid address format</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Error Display */}
      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Contract Analysis */}
      {contractData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {renderContractTypeIcon(contractData.contractType || 'OTHER')}
                  <CardTitle>
                    {contractData.name || 'Unknown Contract'}
                  </CardTitle>
                </div>
                {contractData.isVerified && (
                  <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    Verified
                  </Badge>
                )}
                {contractData.contractType && contractData.contractType !== 'OTHER' && (
                  <Badge variant="secondary">
                    {contractData.contractType}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2">
                {getExplorerUrl(contractData.address, chainId) && (
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={getExplorerUrl(contractData.address, chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Explorer
                    </a>
                  </Button>
                )}
              </div>
            </div>
            {contractData.symbol && (
              <CardDescription className="flex items-center gap-2">
                <span>{contractData.symbol}</span>
                {contractData.logo && (
                  <NextImage 
                    src={contractData.logo} 
                    alt={contractData.name || 'Contract logo'} 
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full"
                  />
                )}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
                <TabsTrigger value="market">Market Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Basic Information
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono break-all flex-1">
                            {contractData.address}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(contractData.address, 'Address')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {contractData.decimals && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Decimals</label>
                          <p className="mt-1">{contractData.decimals}</p>
                        </div>
                      )}
                      
                      {contractData.totalSupply && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Total Supply</label>
                          <p className="mt-1">{formatNumber(contractData.totalSupply)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Market Information */}
                  {(priceData || contractData.holders !== undefined) && (
                    <div className="space-y-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Market Information
                      </h3>
                      
                      <div className="space-y-3">
                        {priceData && (
                          <>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Price</label>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-lg font-semibold">
                                  {formatPrice(priceData.usdPrice)}
                                </span>
                                {priceData.priceChangePercent24h !== 0 && (
                                  <span className={`flex items-center gap-1 text-sm ${
                                    priceData.priceChangePercent24h > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {priceData.priceChangePercent24h > 0 ? (
                                      <TrendingUp className="h-3 w-3" />
                                    ) : (
                                      <TrendingDown className="h-3 w-3" />
                                    )}
                                    {Math.abs(priceData.priceChangePercent24h).toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {priceData.marketCap && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">Market Cap</label>
                                <p className="mt-1">{formatPrice(priceData.marketCap)}</p>
                              </div>
                            )}
                            
                            {priceData.volume24h && (
                              <div>
                                <label className="text-sm font-medium text-muted-foreground">24h Volume</label>
                                <p className="mt-1">{formatPrice(priceData.volume24h)}</p>
                              </div>
                            )}
                          </>
                        )}
                        
                        {contractData.holders !== undefined && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Holders</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{formatNumber(contractData.holders)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="space-y-6">
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics and insights about this contract will be displayed here.
                    This could include transaction patterns, holder analysis, and more.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="technical" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Technical Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contractData.bytecode && contractData.bytecode !== '0x' && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Bytecode</label>
                        <div className="mt-1">
                          <code className="text-xs bg-muted p-2 rounded block break-all max-h-32 overflow-y-auto">
                            {contractData.bytecode.slice(0, 200)}...
                          </code>
                        </div>
                      </div>
                    )}
                    
                    {contractData.abi && contractData.abi.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          ABI Functions ({contractData.abi.length})
                        </label>
                        <div className="mt-1 max-h-32 overflow-y-auto">
                          {contractData.abi.slice(0, 5).map((func: any, index: number) => (
                            <div key={index} className="text-xs bg-muted p-1 rounded mb-1">
                              {func.name || func.type}
                            </div>
                          ))}
                          {contractData.abi.length > 5 && (
                            <div className="text-xs text-muted-foreground">
                              +{contractData.abi.length - 5} more functions
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="market" className="space-y-6">
                {priceData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Current Price</p>
                              <p className="text-2xl font-bold">{formatPrice(priceData.usdPrice)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">24h Change</p>
                              <p className={`text-2xl font-bold ${
                                priceData.priceChangePercent24h > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {priceData.priceChangePercent24h > 0 ? '+' : ''}
                                {priceData.priceChangePercent24h.toFixed(2)}%
                              </p>
                            </div>
                            {priceData.priceChangePercent24h > 0 ? (
                              <TrendingUp className="h-8 w-8 text-green-600" />
                            ) : (
                              <TrendingDown className="h-8 w-8 text-red-600" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {priceData.marketCap && (
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Market Cap</p>
                                <p className="text-2xl font-bold">{formatPrice(priceData.marketCap)}</p>
                              </div>
                              <BarChart3 className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Market Data Available</h3>
                    <p className="text-muted-foreground">
                      This contract doesn't have available market data or price information.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}