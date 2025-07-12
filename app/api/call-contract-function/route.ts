import { NextRequest, NextResponse } from 'next/server';
import { networkService } from '@/app/utils/networks/network-service';
import { ContractCallParams } from '@/app/utils/networks/network-adapter';

/**
 * API route handler for calling contract functions (both read and write)
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      contractAddress, 
      functionName, 
      parameters = [], 
      isQuery = true,
      abi,
      networkId,
      gasLimit,
      value 
    } = await request.json();

    // Validate required parameters
    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address is required' }, 
        { status: 400 }
      );
    }

    if (!functionName) {
      return NextResponse.json(
        { error: 'Function name is required' }, 
        { status: 400 }
      );
    }

    console.log(`Calling contract function: ${functionName} on ${contractAddress}`);
    console.log(`Parameters:`, parameters);
    console.log(`Is query:`, isQuery);
    console.log(`Network ID:`, networkId);

    // Initialize network service if not already initialized
    if (!networkService.isInitialized()) {
      await networkService.initialize();
    }

    // Get the appropriate network adapter
    let adapter;
    if (networkId) {
      // Switch to the specified network
      const switchSuccess = await networkService.changeNetwork(networkId);
      if (!switchSuccess) {
        console.warn(`Failed to switch to network ${networkId}, using active adapter`);
      }
      adapter = networkService.getAdapter();
    } else {
      adapter = networkService.getAdapter();
    }

    if (!adapter) {
      return NextResponse.json(
        { error: 'No blockchain network adapter available' },
        { status: 500 }
      );
    }

    // Prepare contract call parameters
    const callParams: ContractCallParams = {
      contractAddress,
      functionName,
      parameters,
      isQuery,
      abi,
      gasLimit,
      value
    };

    // Call the contract function
    console.log(`Executing contract function via ${adapter.getConfig().name}`);
    const result = await adapter.callContract(callParams);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Contract function call failed',
          result: result
        },
        { status: 400 }
      );
    }

    // Return the result
    return NextResponse.json({
      success: true,
      result: result.outputData,
      transactionId: result.transactionId || result.transactionHash,
      gasUsed: result.gasUsed,
      blockNumber: result.blockNumber,
      explorerUrl: result.explorerUrl,
      contractAddress: result.contractAddress,
      functionName,
      parameters,
      timestamp: new Date().toISOString(),
      network: adapter.getConfig().name,
      networkId: adapter.getConfig().id
    });

  } catch (error: any) {
    console.error('Error calling contract function:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to call contract function',
        details: error.stack && process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 