import { NextRequest, NextResponse } from 'next/server';
import { networkService } from '@/app/utils/networks/network-service';

/**
 * API route handler for fetching comprehensive contract metadata using Moralis
 * Provides token information, price data, transaction history, and analytics
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      contractAddress,
      networkId,
      includeTransactions = false,
      includeEvents = false,
      includePriceData = true,
      includeHolders = false
    } = await request.json();

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address is required' }, 
        { status: 400 }
      );
    }

    console.log(`Fetching comprehensive metadata for contract ${contractAddress} on network ${networkId}`);

    // Initialize network service if not already initialized
    if (!networkService.isInitialized()) {
      await networkService.initialize();
    }

    // Switch to the specified network if provided
    if (networkId) {
      const switchSuccess = await networkService.changeNetwork(networkId);
      if (!switchSuccess) {
        console.warn(`Failed to switch to network ${networkId}, using active adapter`);
      }
    }

    const adapter = networkService.getAdapter();
    if (!adapter) {
      return NextResponse.json(
        { error: 'No blockchain network adapter available' },
        { status: 500 }
      );
    }

    const chainId = adapter.getConfig().chainId || 1;
    
    // Import Moralis service
    const { MoralisContractService } = await import('@/app/utils/moralis-contract-service');
    const moralisService = MoralisContractService.getInstance();

    if (!moralisService.isChainSupported(chainId)) {
      return NextResponse.json(
        { 
          error: `Chain ${chainId} not supported by Moralis`,
          contractAddress,
          networkId: adapter.getConfig().id,
          networkName: adapter.getConfig().name
        },
        { status: 400 }
      );
    }

    // Container for all metadata
    const metadata: any = {
      contractAddress,
      networkId: adapter.getConfig().id,
      networkName: adapter.getConfig().name,
      chainId,
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Get basic contract information
      console.log('Fetching basic contract information...');
      const contractInfo = await moralisService.getContractInfo(contractAddress, chainId);
      metadata.contractInfo = contractInfo;

      // 2. Get token price data if it's a token and requested
      if (includePriceData && contractInfo.contractType && contractInfo.contractType !== 'OTHER') {
        try {
          console.log('Fetching token price data...');
          const priceData = await moralisService.getTokenPrice(contractAddress, chainId);
          metadata.priceData = priceData;
        } catch (priceError) {
          console.warn('Failed to fetch price data:', priceError);
          metadata.priceData = null;
        }
      }

      // 3. Get contract events if requested
      if (includeEvents) {
        try {
          console.log('Fetching contract events...');
          const events = await moralisService.getContractEvents(contractAddress, chainId, {
            limit: 10,
            fromBlock: undefined, // Get recent events
            toBlock: undefined
          });
          metadata.recentEvents = events;
        } catch (eventsError) {
          console.warn('Failed to fetch events:', eventsError);
          metadata.recentEvents = [];
        }
      }

      // 4. Get transaction data if requested
      if (includeTransactions) {
        try {
          console.log('Fetching recent transactions...');
          // This would require implementing transaction fetching in Moralis service
          // For now, we'll set it as an empty array
          metadata.recentTransactions = [];
        } catch (txError) {
          console.warn('Failed to fetch transactions:', txError);
          metadata.recentTransactions = [];
        }
      }

      // 5. Enhanced analysis based on contract type
      if (contractInfo.contractType) {
        metadata.analysis = await analyzeContractByType(contractInfo, moralisService, chainId);
      }

      // 6. Security and verification analysis
      metadata.security = {
        isVerified: contractInfo.isVerified,
        hasSourceCode: !!contractInfo.sourceCode,
        riskLevel: assessRiskLevel(contractInfo),
        recommendations: generateSecurityRecommendations(contractInfo)
      };

      // 7. Explorer URLs
      metadata.explorerUrls = {
        contract: adapter.getExplorerUrl('address', contractAddress),
        transactions: adapter.getExplorerUrl('address', contractAddress) + '#transactions',
        events: adapter.getExplorerUrl('address', contractAddress) + '#events'
      };

      return NextResponse.json({
        success: true,
        metadata,
        dataPoints: {
          basicInfo: !!contractInfo,
          priceData: !!metadata.priceData,
          events: includeEvents ? metadata.recentEvents?.length || 0 : 'not_requested',
          transactions: includeTransactions ? metadata.recentTransactions?.length || 0 : 'not_requested'
        }
      });

    } catch (moralisError: any) {
      console.error('Moralis service error:', moralisError);
      
      // Fallback to basic adapter information
      try {
        const basicInfo = await getBasicContractInfo(contractAddress, adapter);
        metadata.contractInfo = basicInfo;
        metadata.security = {
          isVerified: false,
          hasSourceCode: false,
          riskLevel: 'unknown',
          recommendations: ['Contract verification status unknown', 'Use caution when interacting']
        };

        return NextResponse.json({
          success: true,
          metadata,
          warning: 'Limited data available - Moralis service unavailable',
          dataPoints: {
            basicInfo: true,
            priceData: false,
            events: 'unavailable',
            transactions: 'unavailable'
          }
        });
      } catch (fallbackError) {
        throw moralisError; // Re-throw original error if fallback fails
      }
    }

  } catch (error: any) {
    console.error('Error fetching contract metadata:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch contract metadata',
        details: error.stack && process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Analyze contract based on its type using Moralis data
 */
async function analyzeContractByType(contractInfo: any, moralisService: any, chainId: number): Promise<any> {
  const analysis: any = {
    contractType: contractInfo.contractType,
    features: [],
    recommendations: []
  };

  switch (contractInfo.contractType) {
    case 'ERC20':
      analysis.tokenAnalysis = {
        hasName: !!contractInfo.name,
        hasSymbol: !!contractInfo.symbol,
        hasDecimals: contractInfo.decimals !== undefined,
        hasTotalSupply: !!contractInfo.totalSupply,
        estimatedHolders: contractInfo.holders || 'unknown'
      };
      
      analysis.features = [
        'Standard ERC20 Token',
        contractInfo.name ? `Named Token: ${contractInfo.name}` : 'Unnamed Token',
        contractInfo.symbol ? `Symbol: ${contractInfo.symbol}` : 'No Symbol',
        contractInfo.decimals ? `Decimals: ${contractInfo.decimals}` : 'Default Decimals'
      ];
      
      analysis.recommendations = [
        'Verify token authenticity before trading',
        'Check total supply and distribution',
        'Review contract verification status'
      ];
      break;

    case 'ERC721':
      analysis.nftAnalysis = {
        hasName: !!contractInfo.name,
        hasSymbol: !!contractInfo.symbol,
        collectionSize: 'unknown' // Would need additional API calls
      };
      
      analysis.features = [
        'NFT Collection (ERC721)',
        contractInfo.name ? `Collection: ${contractInfo.name}` : 'Unnamed Collection',
        'Unique Token Standard'
      ];
      
      analysis.recommendations = [
        'Verify collection authenticity',
        'Check metadata and image storage',
        'Review minting and transfer functions'
      ];
      break;

    case 'ERC1155':
      analysis.multiTokenAnalysis = {
        hasName: !!contractInfo.name,
        hasSymbol: !!contractInfo.symbol,
        supportsMultipleTokens: true
      };
      
      analysis.features = [
        'Multi-Token Contract (ERC1155)',
        'Supports both fungible and non-fungible tokens',
        'Batch operations enabled'
      ];
      
      analysis.recommendations = [
        'Review token ID management',
        'Check batch operation security',
        'Verify metadata URI patterns'
      ];
      break;

    default:
      analysis.customAnalysis = {
        hasStandardInterface: false,
        requiresManualReview: true
      };
      
      analysis.features = [
        'Custom Smart Contract',
        'Non-standard token interface',
        'Manual review recommended'
      ];
      
      analysis.recommendations = [
        'Carefully review contract functions',
        'Check for standard security patterns',
        'Verify contract purpose and functionality'
      ];
  }

  return analysis;
}

/**
 * Assess risk level based on contract information
 */
function assessRiskLevel(contractInfo: any): string {
  let riskScore = 0;

  // Positive factors (reduce risk)
  if (contractInfo.isVerified) riskScore -= 30;
  if (contractInfo.sourceCode) riskScore -= 20;
  if (contractInfo.contractType && contractInfo.contractType !== 'OTHER') riskScore -= 20;
  if (contractInfo.name && contractInfo.symbol) riskScore -= 10;

  // Negative factors (increase risk)
  if (!contractInfo.isVerified) riskScore += 40;
  if (!contractInfo.sourceCode) riskScore += 30;
  if (!contractInfo.contractType || contractInfo.contractType === 'OTHER') riskScore += 20;

  // Determine risk level
  if (riskScore <= -40) return 'low';
  if (riskScore <= 0) return 'medium';
  if (riskScore <= 40) return 'high';
  return 'very_high';
}

/**
 * Generate security recommendations based on contract analysis
 */
function generateSecurityRecommendations(contractInfo: any): string[] {
  const recommendations: string[] = [];

  if (!contractInfo.isVerified) {
    recommendations.push('⚠️ Contract source code is not verified - exercise extreme caution');
  }

  if (!contractInfo.sourceCode) {
    recommendations.push('🔍 No source code available - consider this high risk');
  }

  if (contractInfo.contractType === 'OTHER' || !contractInfo.contractType) {
    recommendations.push('🧪 Custom contract logic - manual review required');
  }

  if (!contractInfo.name || !contractInfo.symbol) {
    recommendations.push('📝 Missing standard token metadata - verify authenticity');
  }

  if (contractInfo.isVerified && contractInfo.sourceCode) {
    recommendations.push('✅ Contract is verified - generally safer to interact with');
  }

  // Always include these general recommendations
  recommendations.push(
    '🔐 Always verify function parameters before execution',
    '💰 Start with small amounts for testing',
    '📊 Monitor transaction results carefully'
  );

  return recommendations;
}

/**
 * Get basic contract information using network adapter (fallback)
 */
async function getBasicContractInfo(contractAddress: string, adapter: any): Promise<any> {
  try {
    const bytecode = await adapter.getContractBytecode(contractAddress);
    const hasCode = bytecode && bytecode !== '0x';

    return {
      address: contractAddress,
      isVerified: false,
      hasSourceCode: false,
      contractType: 'OTHER',
      bytecodeSize: hasCode ? bytecode.length / 2 - 1 : 0,
      isDeployed: hasCode,
      source: 'network_adapter_fallback'
    };
  } catch (error) {
    throw new Error(`Failed to get basic contract information: ${error}`);
  }
} 