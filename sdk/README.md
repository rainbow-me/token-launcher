# Rainbow Token Launcher SDK

[![npm version](https://img.shields.io/npm/v/@rainbow-me/token-launcher.svg)](https://www.npmjs.com/package/@rainbow-me/token-launcher)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A TypeScript SDK for launching and interacting with Rainbow Super Tokens

## Installation

```bash
# Using npm
npm install @rainbow-me/token-launcher

# Using yarn
yarn add @rainbow-me/token-launcher
```

## Features

- Launch Rainbow Super Tokens on supported networks
- Launch tokens and buy in a single transaction
- Get airdrop suggestions for token distributions
- Retrieve token information
- Built-in error handling with descriptive error codes
- Full TypeScript support

## Usage

### Configuring the SDK

```typescript
import { TokenLauncher } from '@rainbow-me/token-launcher';

// Configure the SDK
TokenLauncher.configure({
  // For development environment
  API_URL_DEV: 'https://dev-api.example.com',
  API_KEY_DEV: 'your-dev-api-key',
  
  // For production environment
  API_URL_PROD: 'https://api.example.com',
  API_KEY_PROD: 'your-production-api-key',
  
  // Set environment mode
  MODE: 'production', // 'development' | 'production' | 'jest'
});
```

### Launching a Rainbow Super Token

```typescript
import { TokenLauncher, LaunchTokenParams } from '@rainbow-me/token-launcher';
import { Wallet, JsonRpcProvider } from 'ethers';

// Create a wallet instance
const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
const wallet = new Wallet('YOUR_PRIVATE_KEY', provider);

// Define token parameters
const launchParams: LaunchTokenParams = {
  name: 'My Token',
  symbol: 'MTK',
  supply: '1000000000000000000000000', // 1 million tokens with 18 decimals
  wallet: wallet,
  initialTick: 0, // Use getInitialTick for price-based ticks
  logoUrl: 'https://example.com/logo.png',
  description: 'My awesome token for my community',
  links: {
    twitter: 'https://twitter.com/mytoken',
    website: 'https://mytoken.com',
    // Add other relevant links
  },
};

// Launch the token
try {
  const result = await TokenLauncher.launchToken(launchParams);
  console.log('Token launched successfully!');
  console.log('Transaction:', result.transaction.hash);
  console.log('Token Address:', result.tokenAddress);
  console.log('Token URI:', result.tokenUri);
} catch (error) {
  console.error('Failed to launch token:', error);
}
```

### Launch Token and Buy in One Transaction

```typescript
import { TokenLauncher, LaunchTokenAndBuyParams } from '@rainbow-me/token-launcher';
import { parseEther } from 'ethers/lib/utils';

const launchAndBuyParams: LaunchTokenAndBuyParams = {
  // Include all parameters from LaunchTokenParams
  name: 'My Token',
  symbol: 'MTK',
  supply: '1000000000000000000000000', // 1 million tokens with 18 decimals
  wallet: wallet,
  initialTick: 0,
  logoUrl: 'https://example.com/logo.png',
  
  // Add the amount of ETH to use for buying
  amountIn: parseEther('0.1').toString(), // 0.1 ETH
  
  // Optional gas parameters
  transactionOptions: {
    gasLimit: '3000000',
    // For EIP-1559 networks
    maxFeePerGas: '50000000000', // 50 gwei
    maxPriorityFeePerGas: '1500000000', // 1.5 gwei
    // For legacy networks (e.g., Polygon)
    gasPrice: '30000000000', // 30 gwei
  },
};

try {
  const result = await TokenLauncher.launchTokenAndBuy(launchAndBuyParams);
  console.log('Token launched and bought successfully!');
  console.log('Transaction:', result.transaction.hash);
} catch (error) {
  console.error('Failed to launch and buy token:', error);
}
```

### Getting the Initial Tick

```typescript
import { TokenLauncher } from '@rainbow-me/token-launcher';
import { parseEther } from 'ethers/lib/utils';

// Calculate the initial tick based on desired token price
const tokenPriceInETH = parseEther('0.0001'); // 0.0001 ETH per token
const initialTick = TokenLauncher.getInitialTick(tokenPriceInETH);
```

### Getting Airdrop Suggestions

```typescript
import { TokenLauncher } from '@rainbow-me/token-launcher';

// Get airdrop suggestions for an address
const address = '0x1234567890123456789012345678901234567890';
const suggestions = await TokenLauncher.getAirdropSuggestions(address);

console.log('Predefined cohorts:', suggestions.predefinedCohorts);
console.log('Personalized cohorts:', suggestions.personalizedCohorts);
```

### Error Handling

The SDK provides typed error codes for better error handling:

```typescript
import { TokenLauncher, TokenLauncherErrorCode } from '@rainbow-me/token-launcher';

try {
  const result = await TokenLauncher.launchToken(params);
} catch (error) {
  if (error.code === TokenLauncherErrorCode.INSUFFICIENT_FUNDS) {
    console.error('You do not have enough funds to complete this transaction.');
  } else if (error.code === TokenLauncherErrorCode.WALLET_CONNECTION_ERROR) {
    console.error('Could not connect to wallet. Please check your connection.');
  } else {
    console.error('An unexpected error occurred:', error.message);
  }
}
```

## API Reference

### Core Methods

- `TokenLauncher.configure(config)`: Configure the SDK with API endpoints and keys
- `TokenLauncher.launchToken(params)`: Launch a new Rainbow Super Token
- `TokenLauncher.launchTokenAndBuy(params)`: Launch a token and buy in a single transaction
- `TokenLauncher.getInitialTick(tokenPrice)`: Calculate the initial tick based on token price
- `TokenLauncher.getAirdropSuggestions(address)`: Get airdrop suggestions for an address
- `TokenLauncher.getRainbowSuperTokens()`: Get all Rainbow Super Tokens
- `TokenLauncher.getRainbowSuperTokenByUri(uri)`: Get a specific token by URI

### Error Codes

The SDK provides the following error codes for better error handling:

- `API_REQUEST_FAILED`: Failed to make API request
- `API_RESPONSE_INVALID`: Received invalid API response
- `SUBMISSION_DETAILS_MISSING`: Missing submission details
- `TRANSACTION_FAILED`: Transaction failed
- `CONTRACT_INTERACTION_FAILED`: Failed to interact with contract
- `INSUFFICIENT_FUNDS`: Insufficient funds for transaction
- `GAS_ESTIMATION_FAILED`: Failed to estimate gas
- `INVALID_SALT`: Invalid salt for token deployment
- `INVALID_PARAMS`: Invalid parameters
- `MISSING_REQUIRED_PARAM`: Missing required parameter
- `WALLET_CONNECTION_ERROR`: Wallet connection error
- `UNKNOWN_ERROR`: Unknown error

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).
