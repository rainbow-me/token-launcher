---
'@rainbow-me/token-launcher': patch
---

Remove RainbowSuperToken protocol and related APIs

- Remove `getAirdropSuggestions()`, `getRainbowSuperTokens()`, `getRainbowSuperTokenByUri()`, `getTokenLauncherContractConfig()` from `TokenLauncher`
- Remove `launchRainbowSuperToken()`, `launchRainbowSuperTokenAndBuy()` deploy flow
- Remove `submitRainbowSuperToken()`, `getRainbowSuperToken()`, `rainbowFetch()` API layer
- Remove `predictAddress()`, `findValidSalt()` salt-mining utilities
- Remove `RainbowSuperTokenFactory` ABI and factory contract bindings (`getFactoryConfig`, `getFactorySupportedChains`, `getRainbowSuperTokenFactory`)
- Remove `airdropMetadata` field from `LaunchTokenParams`
