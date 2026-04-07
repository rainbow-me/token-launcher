# Rainbow Token Launcher SDK

[![npm version](https://img.shields.io/npm/v/@rainbow-me/token-launcher.svg)](https://www.npmjs.com/package/@rainbow-me/token-launcher)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

A TypeScript SDK for launching tokens through protocol adapters.

## Installation

```bash
npm install @rainbow-me/token-launcher viem
```

## Usage

```typescript
import { TokenLauncher, Protocol } from '@rainbow-me/token-launcher';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const account = privateKeyToAccount('0x...');
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});
const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http('https://mainnet.base.org'),
});

TokenLauncher.configure({
  chains: [base.id],
});

const result = await TokenLauncher.launchToken({
  protocol: Protocol.Clanker,
  name: 'My Token',
  symbol: 'MTK',
  walletClient,
  publicClient,
  logoUrl: 'https://example.com/logo.png',
  description: 'My token',
  links: {
    website: 'https://mytoken.com',
  },
});
```

## Public API

- `TokenLauncher.configure(config)`
- `TokenLauncher.getConfig()`
- `TokenLauncher.getInitialTick(tokenPrice)`
- `TokenLauncher.launchToken(params)`

## Configuration

```typescript
interface SDKConfig {
  chains?: readonly number[];
}
```

## Launch Parameters

```typescript
enum Protocol {
  Clanker = 'clanker',
}

interface LaunchTokenParams {
  protocol: Protocol;
  name: string;
  symbol: string;
  walletClient: WalletClient;
  publicClient: PublicClient;
  amountIn?: string;
  logoUrl?: string;
  description?: string;
  links?: Record<string, string>;
}

interface LaunchTokenResponse {
  txHash: Hash;
  tokenUri?: string;
  tokenAddress: string;
}
```

If `amountIn` is provided and non-zero, `launchToken` performs a launch and buy in the same protocol call.

## Protocols

- `clanker`
  - Protocol version: Clanker v4
  - SDK dependency: `clanker-sdk@4.1.19`
  - Supported chain: Base (`8453`)
  - Hardcoded addresses used by this repo:
    - Interface reward recipient/admin: `0xE96D3027913064A16A17B27ca8b5A52120C11F91`
    - Default quote token in Clanker v4 examples: WETH on Base `0x4200000000000000000000000000000000000006`
  - Notes: this repo does not hardcode the Clanker factory address; deployment contract resolution is delegated to `clanker-sdk`.

## Error Handling

All SDK errors are instances of `TokenLauncherSDKError` and expose a `code` from `TokenLauncherErrorCode`.

### Error Codes

- `INVALID_PROTOCOL`
- `INVALID_ADDRESS`
- `UNSUPPORTED_CHAIN_ID`
- `INVALID_AMOUNT_IN_PARAM`
- `MISSING_REQUIRED_PARAM`
- `INSUFFICIENT_FUNDS`
- `GAS_ESTIMATION_FAILED`
- `CONTRACT_INTERACTION_FAILED`
- `TRANSACTION_FAILED`
- `WALLET_CONNECTION_ERROR`
- `UNKNOWN_ERROR`
