---
'@solana-mobile/skr-genesis-token': patch
---

Fix `getSeekerGenesisTokens` and `hasSeekerGenesisToken` throwing `TypeError: undefined is not a function` on React Native: Hermes has no `Array.prototype.toSorted`.
