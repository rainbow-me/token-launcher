# @rainbow-me/token-launcher

## 0.2.0

### Minor Changes

- Add Clanker v4 protocol via `clanker-sdk`
- Add support for token launching and dev buys in a single `launchToken()` call
- Add fee-split rewards (50/50 creator/interface)

## 0.1.0

### Minor Changes

- Initial release of the Rainbow Token Launcher SDK
- Add `launchToken()` and `launchTokenAndBuy()` for launching RainbowSuperTokens
- Add `getAirdropSuggestions()`, `getRainbowSuperTokens()`, `getRainbowSuperTokenByUri()` API methods
- Add `getTokenLauncherContractConfig()` for reading on-chain fee config
- Add `getInitialTick()` for computing Uniswap v3 pool ticks from a token price
- Add typed error handling with `TokenLauncherErrorCode` and `TokenLauncherSDKError`
