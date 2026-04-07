---
'@rainbow-me/token-launcher': patch
---

Add multi-protocol support with `protocol` field on `LaunchTokenParams`

- Add required `protocol` field to `LaunchTokenParams` (`Protocol` enum, Base only)
- `launchToken()` now always returns `LaunchTokenResponse` (previously `LaunchTokenResponse | undefined`)
- `SDKConfig` is now `{ chains?: readonly number[] }` (replaces `API_URL_*`, `API_KEY_*`, `SUPPORTED_NETWORKS`, `MODE`)
- `LaunchTokenParams.logoUrl` is now optional
- `LaunchTokenResponse.tokenUri` is now optional
- Remove `supply`, `creator`, `initialTick`, `transactionOptions` from `LaunchTokenParams`
- Remove `launchTokenAndBuy()` — pass `amountIn` to `launchToken()` instead
- Export `Protocol` enum, `SupportedChain` type, `TokenLauncherErrorCode` enum, `TokenLauncherSDKError` class
