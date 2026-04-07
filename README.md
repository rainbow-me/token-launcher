# Rainbow Token Launcher SDK

[![npm version](https://img.shields.io/npm/v/@rainbow-me/token-launcher.svg)](https://www.npmjs.com/package/@rainbow-me/token-launcher)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL%203.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

Launch ERC-20 tokens on Base through [Clanker](https://clanker.world) and [Liquid Protocol](https://github.com/Liquid-Protocol-Ops/liquid-protocol-v0).

## Install

```bash
npm install @rainbow-me/token-launcher viem
```

## Quick Start

```typescript
import { TokenLauncher, Protocol } from '@rainbow-me/token-launcher';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const account = privateKeyToAccount('0x...');
const publicClient = createPublicClient({ chain: base, transport: http() });
const walletClient = createWalletClient({ account, chain: base, transport: http() });

TokenLauncher.configure({ chains: [8453] });

const { txHash, tokenAddress } = await TokenLauncher.launchToken({
  protocol: Protocol.Liquid, // or Protocol.Clanker
  name: 'My Token',
  symbol: 'MTK',
  walletClient,
  publicClient,
  logoUrl: 'https://example.com/logo.png',
  amountIn: '0', // wei — set non-zero for a dev buy at launch
});
```

## API

| Method | Description |
|---|---|
| `configure(config)` | Set `{ chains: number[] }` |
| `getConfig()` | Read current config |
| `getInitialTick(price)` | Compute starting tick from a token price |
| `launchToken(params)` | Deploy a token and return `{ txHash, tokenAddress, tokenUri? }` |

## Protocols

Both protocols deploy tokens paired against WETH on Base via Uniswap V4.

|  | Clanker | Liquid |
|---|---|---|
| **Token** | ERC-20 | ERC-20 (18 decimals, 100B supply) |
| **Rewards** | 50% creator / 50% Rainbow | 100% creator (WETH) |
| **Fees** | Set by Clanker SDK | 80% creator / 20% protocol |

Liquid contracts are verified on Basescan, forked from Clanker v4, and audited by [0xMacro](https://0xmacro.com/library/audits/clanker-3) and [Cantina](https://cantina.xyz/portfolio/e4db23cd-f46d-4d99-adca-a60941b44f65).

## Errors

All errors are `TokenLauncherSDKError` with a `code`:

`INVALID_PROTOCOL` · `INVALID_ADDRESS` · `UNSUPPORTED_CHAIN_ID` · `INVALID_AMOUNT_IN_PARAM` · `MISSING_REQUIRED_PARAM` · `INSUFFICIENT_FUNDS` · `GAS_ESTIMATION_FAILED` · `CONTRACT_INTERACTION_FAILED` · `TRANSACTION_FAILED` · `WALLET_CONNECTION_ERROR` · `UNKNOWN_ERROR`
