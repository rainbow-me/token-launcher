# @rainbow-me/token-launcher

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
