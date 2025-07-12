# Environment Setup for Multi-Network Support

This document outlines the environment variables required to support multiple blockchain networks in the application.

## Environment Variables

Add the following variables to your `.env.local` file:

```
# WalletConnect Project ID
# Get this from WalletConnect Cloud Dashboard (https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here

# Hedera Testnet Account Credentials
# Get these from Hedera Portal (https://portal.hedera.com/)
HEDERA_OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
HEDERA_OPERATOR_KEY=YOUR_PRIVATE_KEY
HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com/api/v1
HEDERA_RPC_URL=https://testnet.hashio.io/api

# Ethereum Network Credentials
# Store your private key securely!
ETHEREUM_PRIVATE_KEY=YOUR_ETHEREUM_PRIVATE_KEY

# Ethereum Network RPC URLs
# You can use public RPC endpoints or sign up for services like Infura, Alchemy, etc.
SEPOLIA_RPC_URL=https://rpc.sepolia.org
GOERLI_RPC_URL=https://rpc.ankr.com/eth_goerli

# Etherscan API Key
# Required for ABI verification and contract source code access
# Register at https://etherscan.io/apis
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# Moralis API Key
# Required for blockchain data, NFTs, DeFi analytics, and contract information
# Register at https://admin.moralis.io and create a new app
NEXT_PUBLIC_MORALIS_API_KEY=YOUR_MORALIS_API_KEY

# Default network to use (options: hedera-testnet, ethereum-sepolia, ethereum-goerli)
DEFAULT_NETWORK=hedera-testnet
```

## Network Configuration

### Hedera Testnet

1. Create a Hedera Testnet account via [Hedera Portal](https://portal.hedera.com/)
2. Get your Account ID and Private Key
3. Add these to your environment variables

### Ethereum Testnets (Sepolia and Goerli)

1. Create an Ethereum wallet (using MetaMask or other wallets)
2. Export your private key (do this securely!)
3. Get testnet tokens:
   - [Sepolia Faucet](https://sepoliafaucet.com/)
   - [Goerli Faucet](https://goerlifaucet.com/)
4. (Optional) Create an account on [Etherscan](https://etherscan.io/register) to get an API key

### Moralis Setup

1. Go to [Moralis Admin Panel](https://admin.moralis.io)
2. Create a new account or sign in
3. Create a new app/project
4. Copy your API key from the app dashboard
5. Add it to your environment variables as `NEXT_PUBLIC_MORALIS_API_KEY`

**Moralis Features Available:**
- Contract metadata and ABI fetching
- Token balances and transfers
- NFT metadata and ownership
- DeFi token prices and liquidity
- Transaction details and history
- Wallet portfolio analytics
- Real-time blockchain events

## RPC URLs

The default RPC URLs provided in the example are public endpoints. For production or heavy usage:

1. Consider using dedicated RPC providers like:
   - [Infura](https://infura.io/)
   - [Alchemy](https://www.alchemy.com/)
   - [QuickNode](https://www.quicknode.com/)
   
2. Replace the RPC URLs with your dedicated endpoints.

## Security Considerations

1. Never commit your private keys to version control
2. Use environment variables for local development
3. Use secure key management services for production deployments 

## Troubleshooting

### Network Initialization Errors

If you see errors like "Failed to initialize network hedera-testnet":

1. **Missing Hedera Credentials**: This is normal if you haven't set up Hedera credentials yet. The app will continue to work in read-only mode for Hedera networks.

2. **Network Service Fallback**: The app is designed to gracefully handle missing network configurations and will fallback to read-only mode.

3. **Ethereum Networks**: All Ethereum-based networks should work out of the box with public RPC endpoints.

### Common Issues

1. **"Connection interrupted while trying to subscribe"**
   - Ensure you have a valid WalletConnect Project ID
   - Check your internet connection
   - Try clearing browser cache and localStorage

2. **"Cannot destructure property 'value' of 'undefined'"**
   - This was a Wagmi configuration issue that has been resolved
   - Restart your development server after updating

3. **"could not detect network" or RPC connection errors**
   - The app now includes fallback RPC endpoints for better reliability
   - If primary RPC fails, it automatically tries backup endpoints
   - Networks will continue in read-only mode if all RPC endpoints fail
   - This is normal and doesn't break the application

4. **Missing Environment Variables**
   - Copy `.env.local.example` to `.env.local` if available
   - Check that all required variables are set
   - Restart your development server after changes

### Network Resilience Features

The application includes several features to handle network connectivity issues:

1. **Multiple RPC Endpoints**: Each network has multiple backup RPC URLs
2. **Automatic Fallbacks**: If one endpoint fails, the system tries others
3. **Timeout Handling**: Connections have reasonable timeouts to prevent hanging
4. **Graceful Degradation**: Networks continue in read-only mode if full connectivity fails
5. **Retry Logic**: Failed operations are retried with different endpoints 