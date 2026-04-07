# @rainbow-me/token-launcher

## 0.3.0

### Minor Changes

- c83c397: Add Liquid Protocol adapter (`Protocol.Liquid`) 💧
  - Add `Protocol.Liquid` to the `Protocol` enum via `liquid-sdk`
  - Only supports Base
  - Supports creator buys via `amountIn`
  - 100% of reward fees allocated to the creator

- 6e77934: Migrate from ethers.js to viem
  - `LaunchTokenParams` now takes `walletClient` and `publicClient` instead of `wallet`:
    ```diff
    - sdk.launchToken({ wallet, ... })
    + sdk.launchToken({ walletClient, publicClient, ... })
    ```
  - `LaunchTokenResponse.transaction` replaced by `LaunchTokenResponse.txHash` (`Hash`). Callers that need the full transaction object can fetch it via `publicClient.getTransaction({ hash: txHash })`
  - `getInitialTick()` takes `bigint` (was ethers `BigNumber`). Use `parseEther()` from viem
  - `viem` is now a peer dependency (`^2.38.0`) — consumers must install it directly
  - Remove all `@ethersproject/*` packages from your dependencies

- 2fc1f60: Add multi-protocol support with `protocol` field on `LaunchTokenParams`
  - Add required `protocol` field to `LaunchTokenParams` (`Protocol` enum, Base only)
  - `launchToken()` now always returns `LaunchTokenResponse` (previously `LaunchTokenResponse | undefined`)
  - `SDKConfig` is now `{ chains?: readonly number[] }` (replaces `API_URL_*`, `API_KEY_*`, `SUPPORTED_NETWORKS`, `MODE`)
  - `LaunchTokenParams.logoUrl` is now optional
  - `LaunchTokenResponse.tokenUri` is now optional
  - Remove `supply`, `creator`, `initialTick`, `transactionOptions` from `LaunchTokenParams`
  - Remove `launchTokenAndBuy()` — pass `amountIn` to `launchToken()` instead
  - Export `Protocol` enum, `SupportedChain` type, `TokenLauncherErrorCode` enum, `TokenLauncherSDKError` class

- 2fc1f60: Remove RainbowSuperToken protocol and related APIs
  - Remove `getAirdropSuggestions()`, `getRainbowSuperTokens()`, `getRainbowSuperTokenByUri()`, `getTokenLauncherContractConfig()` from `TokenLauncher`
  - Remove `launchRainbowSuperToken()`, `launchRainbowSuperTokenAndBuy()` deploy flow
  - Remove `submitRainbowSuperToken()`, `getRainbowSuperToken()`, `rainbowFetch()` API layer
  - Remove `predictAddress()`, `findValidSalt()` salt-mining utilities
  - Remove `RainbowSuperTokenFactory` ABI and factory contract bindings (`getFactoryConfig`, `getFactorySupportedChains`, `getRainbowSuperTokenFactory`)
  - Remove `airdropMetadata` field from `LaunchTokenParams`

## 0.2.0

- Add Clanker v4 protocol via `clanker-sdk` (Base only)
- Token launching and dev buys in a single `launchToken()` call
- Fee-split rewards (50/50 creator/interface)

## 0.1.0

- Initial release
- `launchToken()` and `launchTokenAndBuy()` for RainbowSuperTokens
- `getAirdropSuggestions()`, `getRainbowSuperTokens()`, `getRainbowSuperTokenByUri()` API methods
- `getTokenLauncherContractConfig()` for on-chain fee config
- `getInitialTick()` for Uniswap v3 pool tick computation
- Typed errors via `TokenLauncherErrorCode` and `TokenLauncherSDKError`
