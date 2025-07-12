'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Copy, 
  ExternalLink, 
  Code, 
  Database, 
  Network,
  CheckCircle,
  Shield,
  FileText,
  TrendingUp,
  Coins,
  Users,
  AlertTriangle,
  Info,
  Star,
  Globe,
  Zap
} from 'lucide-react';
import { useMoralisContract, useMoralisTokenPrice } from '@/app/hooks/useMoralisContract';
import { useChainId } from 'wagmi';

interface ContractInfoProps {
  address: string;
  networkName: string;
  explorerUrl: string;
  abiLength: number;
  onCopyAddress: () => void;
}

export default function ContractInfo({ 
  address, 
  networkName, 
  explorerUrl, 
  abiLength, 
  onCopyAddress 
}: ContractInfoProps) {
  const chainId = useChainId();
  const [showFullAddress, setShowFullAddress] = useState(false);

  // Fetch comprehensive contract data via Moralis
  const { data: moralisData, loading: moralisLoading } = useMoralisContract(address, chainId);
  
  // Fetch token price data if it's a token contract
  const { data: priceData, loading: priceLoading } = useMoralisTokenPrice(
    moralisData?.contractType !== 'OTHER' ? address : '',
    chainId
  );

  const formatAddress = (addr: string) => {
    if (showFullAddress) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatNumber = (num: number | string | undefined): string => {
    if (!num) return '0';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (numValue >= 1e9) return `${(numValue / 1e9).toFixed(2)}B`;
    if (numValue >= 1e6) return `${(numValue / 1e6).toFixed(2)}M`;
    if (numValue >= 1e3) return `${(numValue / 1e3).toFixed(2)}K`;
    return numValue.toFixed(2);
  };

  const formatPrice = (price: number | undefined): string => {
    if (!price) return '$0.00';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  const getContractTypeInfo = (type: string | undefined) => {
    switch (type) {
      case 'ERC20':
        return { icon: Coins, label: 'Token Contract', color: 'bg-green-500' };
      case 'ERC721':
        return { icon: FileText, label: 'NFT Contract', color: 'bg-purple-500' };
      case 'ERC1155':
        return { icon: Database, label: 'Multi-Token Contract', color: 'bg-blue-500' };
      default:
        return { icon: Code, label: 'Smart Contract', color: 'bg-gray-500' };
    }
  };

  const contractTypeInfo = getContractTypeInfo(moralisData?.contractType);
  const TypeIcon = contractTypeInfo.icon;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Main Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${contractTypeInfo.color} bg-opacity-10`}>
              <TypeIcon className={`h-5 w-5 ${contractTypeInfo.color.replace('bg-', 'text-')}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {moralisData?.name ? (
                  <span>{moralisData.name}</span>
                ) : (
                  <span>Contract</span>
                )}
                {moralisData?.symbol && (
                  <Badge variant="outline" className="text-xs">
                    {moralisData.symbol}
                  </Badge>
                )}
              </div>
              <div className="text-sm font-normal text-muted-foreground">
                {contractTypeInfo.label}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Contract Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Contract Address</label>
            <div className="flex items-center gap-2">
              <code 
                className="flex-1 p-2 rounded bg-muted text-sm font-mono cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setShowFullAddress(!showFullAddress)}
              >
                {formatAddress(address)}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={onCopyAddress}
                className="flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(explorerUrl, '_blank')}
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">Explorer</span>
              </Button>
            </div>
          </div>

          {/* Network and Verification Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{networkName}</span>
            </div>
            <div className="flex items-center gap-2">
              {moralisData?.isVerified ? (
                <Badge variant="default" className="bg-green-500 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Unverified
                </Badge>
              )}
            </div>
          </div>

          {/* ABI Functions Count */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Functions Available</span>
            <span className="font-medium">{abiLength}</span>
          </div>
        </CardContent>
      </Card>

      {/* Token/Contract Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Contract Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {moralisLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Token Information */}
              {moralisData?.contractType === 'ERC20' && (
                <div className="space-y-3">
                  {moralisData.totalSupply && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Supply</span>
                      <span className="text-sm font-medium">
                        {formatNumber(moralisData.totalSupply)}
                        {moralisData.symbol && ` ${moralisData.symbol}`}
                      </span>
                    </div>
                  )}
                  
                  {moralisData.decimals && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Decimals</span>
                      <span className="text-sm font-medium">{moralisData.decimals}</span>
                    </div>
                  )}

                  {/* Price Information */}
                  {priceData && !priceLoading && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <span className="text-sm font-medium">
                          {formatPrice(priceData.usdPrice)}
                        </span>
                      </div>
                      
                      {priceData.priceChangePercent24h !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">24h Change</span>
                          <span className={`text-sm font-medium ${
                            priceData.priceChangePercent24h >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {priceData.priceChangePercent24h >= 0 ? '+' : ''}
                            {priceData.priceChangePercent24h.toFixed(2)}%
                          </span>
                        </div>
                      )}

                      {priceData.marketCap && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Market Cap</span>
                          <span className="text-sm font-medium">
                            ${formatNumber(priceData.marketCap)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Contract Type Specific Information */}
              {moralisData?.contractType === 'ERC721' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">NFT Collection</span>
                  </div>
                  
                  {moralisData.name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Collection Name</span>
                      <span className="text-sm font-medium">{moralisData.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* General Contract Information */}
              {!moralisData?.contractType || moralisData.contractType === 'OTHER' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Smart Contract</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Contract Type</span>
                    <span className="text-sm font-medium">Custom Logic</span>
                  </div>
                </div>
              ) : null}

              {/* Verification and Security Info */}
              <div className="pt-3 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    {moralisData?.isVerified ? (
                      <>
                        <Shield className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-600">Source Verified</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs text-yellow-600">Unverified Source</span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-blue-600">{abiLength} Functions</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Actions */}
      <Card className="md:col-span-2">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              {networkName}
            </Badge>
            
            {moralisData?.contractType && (
              <Badge variant="outline" className="gap-1">
                <TypeIcon className="h-3 w-3" />
                {moralisData.contractType}
              </Badge>
            )}
            
            <Badge variant="outline" className="gap-1">
              <Code className="h-3 w-3" />
              {abiLength} Functions
            </Badge>

            {moralisData?.isVerified && (
              <Badge variant="outline" className="gap-1 text-green-600 border-green-200">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            )}

            {priceData && (
              <Badge variant="outline" className="gap-1 text-blue-600 border-blue-200">
                <TrendingUp className="h-3 w-3" />
                {formatPrice(priceData.usdPrice)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 