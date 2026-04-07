---
'@rainbow-me/token-launcher': minor
---

Migrate from ethers.js to viem

- `LaunchTokenParams` now takes `walletClient` and `publicClient` instead of `wallet`:
  ```diff
  - sdk.launchToken({ wallet, ... })
  + sdk.launchToken({ walletClient, publicClient, ... })
  ```
- `LaunchTokenResponse.transaction` replaced by `LaunchTokenResponse.txHash` (`Hash`). Callers that need the full transaction object can fetch it via `publicClient.getTransaction({ hash: txHash })`
- `getInitialTick()` takes `bigint` (was ethers `BigNumber`). Use `parseEther()` from viem
- `viem` is now a peer dependency (`^2.38.0`) — consumers must install it directly
- Remove all `@ethersproject/*` packages from your dependencies
