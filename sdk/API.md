# Rainbow Token Launcher SDK - API Reference

This document provides detailed API documentation for the Rainbow Token Launcher SDK.

## Core Object

### TokenLauncher

The main entry point to the SDK is the `TokenLauncher` singleton object, which provides access to all SDK functionality.

```typescript
import { TokenLauncher } from '@rainbow-me/token-launcher';
```

## Configuration

### TokenLauncher.configure(config)

Configures the SDK with the necessary API endpoints, keys, and other settings.

**Parameters:**

```typescript
interface SDKConfig {
  // API URLs
  API_URL_DEV?: string;
  API_URL_PROD?: string;

  // API keys
  API_KEY_DEV?: string;
  API_KEY_PROD?: string;

  // Supported networks
  SUPPORTED_NETWORKS?: SupportedNetwork[];

  // Mode
  MODE?: 'jest' | 'development' | 'production';
}

interface SupportedNetwork {
  chainId: number;
  contractAddress: string;
}
```

**Example:**

```typescript
TokenLauncher.configure({
  API_URL_PROD: 'https://api.example.com',
  API_KEY_PROD: 'your-api-key',
  MODE: 'production',
  SUPPORTED_NETWORKS: [
    {
      chainId: 1, // Ethereum Mainnet
      contractAddress: '0x1234567890123456789012345678901234567890'
    },
    {
      chainId: 137, // Polygon Mainnet
      contractAddress: '0x0987654321098765432109876543210987654321'
    }
  ]
});
```

### TokenLauncher.getConfig()

Returns the current SDK configuration.

**Returns:** `SDKConfig` - The current configuration object

**Example:**

```typescript
const config = TokenLauncher.getConfig();
console.log('Current API URL:', config.MODE === 'production' ? config.API_URL_PROD : config.API_URL_DEV);
```

## Token Launch Methods

### TokenLauncher.launchToken(params)

Launches a new Rainbow Super Token.

**Parameters:**

```typescript
interface LaunchTokenParams {
  name: string;                      // Token name
  symbol: string;                    // Token symbol
  supply: string;                    // Total supply (in wei format)
  client: Client;                    // Viem Client
  initialTick?: number;              // Initial tick (price setting)
  creator?: string;                  // Creator address (defaults to wallet address)
  transactionOptions?: {             // Optional gas parameters
    gasLimit?: string;
    gasPrice?: string;               // For legacy transactions
    maxFeePerGas?: string;           // For EIP-1559 transactions
    maxPriorityFeePerGas?: string;   // For EIP-1559 transactions
  };
  logoUrl: string;                   // URL to token logo image
  description?: string;              // Token description
  links?: Record<string, string>;    // Social/website links
  airdropMetadata?: AirdropMetadata; // Optional airdrop information
}
```

**Returns:** `Promise<LaunchTokenResponse>` - A promise that resolves to the token launch response

```typescript
interface LaunchTokenResponse {
  transaction: Transaction;          // Viem Transaction
  tokenUri: string;                  // Token URI
  tokenAddress: string;              // Deployed token contract address
}
```

**Example:**

```typescript
const result = await TokenLauncher.launchToken({
  name: 'My Token',
  symbol: 'MTK',
  supply: '1000000000000000000000000', // 1 million tokens (with 18 decimals)
  client: client,
  initialTick: 0,
  logoUrl: 'https://example.com/logo.png',
  description: 'My awesome community token',
  links: {
    twitter: 'https://twitter.com/mytoken',
    website: 'https://mytoken.com'
  }
});
```

### TokenLauncher.launchTokenAndBuy(params)

Launches a new Rainbow Super Token and buys some tokens in a single transaction.

**Parameters:**

```typescript
interface LaunchTokenAndBuyParams extends LaunchTokenParams {
  amountIn: string; // Required: Amount of ETH to use for purchase (in wei format)
}
```

**Returns:** `Promise<LaunchTokenResponse>` - Same as launchToken method

**Example:**

```typescript
const result = await TokenLauncher.launchTokenAndBuy({
  name: 'My Token',
  symbol: 'MTK',
  supply: '1000000000000000000000000',
  client: client,
  initialTick: 0,
  logoUrl: 'https://example.com/logo.png',
  amountIn: '100000000000000000', // 0.1 ETH
  transactionOptions: {
    gasLimit: '3000000',
    gasPrice: '30000000000' // 30 gwei - for legacy networks
  }
});
```

### TokenLauncher.getInitialTick(tokenPrice)

Calculates the initial tick value based on the desired token price.

**Parameters:**
- `tokenPrice`: `BigNumber` - The desired token price in ETH (as a BigNumber)

**Returns:** `number` - The calculated tick value

**Example:**

```typescript
import { parseEther } from 'viem';

// For a token price of 0.0001 ETH
const tokenPrice = parseEther('0.0001');
const tick = TokenLauncher.getInitialTick(tokenPrice);
```

## Token Information Methods

### TokenLauncher.getRainbowSuperTokens()

Gets a list of all Rainbow Super Tokens.

**Returns:** `Promise<GetRainbowSuperTokensResponse>` - A promise that resolves to the list of tokens

**Example:**

```typescript
const tokens = await TokenLauncher.getRainbowSuperTokens();
console.log('Total tokens:', tokens.data.length);
```

### TokenLauncher.getRainbowSuperTokenByUri(uri)

Gets information about a specific Rainbow Super Token by its URI.

**Parameters:**
- `uri`: `string` - The token URI

**Returns:** `Promise<GetRainbowSuperTokenResponse>` - A promise that resolves to the token information

**Example:**

```typescript
const tokenInfo = await TokenLauncher.getRainbowSuperTokenByUri('https://example.com/token/123');
console.log('Token name:', tokenInfo.data.name);
```

### TokenLauncher.getAirdropSuggestions(address)

Gets airdrop suggestions for a specific address.

**Parameters:**
- `address`: `string` - The address to get suggestions for

**Returns:** `Promise<GetAirdropSuggestionsResponse>` - A promise that resolves to the airdrop suggestions

**Example:**

```typescript
const suggestions = await TokenLauncher.getAirdropSuggestions('0x1234567890123456789012345678901234567890');

// Access predefined cohorts
console.log('Predefined cohorts:', suggestions.predefinedCohorts);

// Access personalized cohorts
console.log('Personalized cohorts:', suggestions.personalizedCohorts);
```

## Error Handling

The SDK provides typed error codes for better error handling. All errors thrown by the SDK will be instances of `TokenLauncherSDKError`.

```typescript
class TokenLauncherSDKError extends Error {
  readonly code: TokenLauncherErrorCode;
  readonly context: {
    operation: string;
    params?: any;
    source: 'api' | 'chain' | 'sdk';
    chainId?: number;
    transactionHash?: string;
    originalError?: any;
  };
}
```

### Error Codes (TokenLauncherErrorCode)

The following error codes are available:

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

**Example usage:**

```typescript
import { TokenLauncher, TokenLauncherErrorCode } from '@rainbow-me/token-launcher';

try {
  const result = await TokenLauncher.launchToken(params);
} catch (error) {
  if (error.code === TokenLauncherErrorCode.INSUFFICIENT_FUNDS) {
    console.error('Insufficient funds for transaction. Please add more funds to your wallet.');
  } else if (error.code === TokenLauncherErrorCode.CONTRACT_INTERACTION_FAILED) {
    console.error('Failed to interact with contract:', error.message);
    console.log('Operation that failed:', error.context.operation);
    console.log('Source of error:', error.context.source);
  } else {
    console.error('Unknown error:', error);
  }
}
``` 