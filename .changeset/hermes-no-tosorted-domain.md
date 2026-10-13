---
'@solana-mobile/skr-domain': patch
---

Fix `getSkrDomains` throwing `TypeError: undefined is not a function` on React Native: Hermes has no `Array.prototype.toSorted`.
