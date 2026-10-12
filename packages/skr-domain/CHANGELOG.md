# @solana-mobile/skr-domain

## 1.0.0

### Major Changes

- 524c2a9: First release. Resolves `.skr` names on mainnet with `@solana/kit`: `resolveSkrDomain` resolves a name to its owner, name account and expiry with one `getAccountInfo` request, `getPrimarySkrDomain` returns the primary `.skr` name a wallet picked after checking that the wallet still owns it, `getSkrNameAddress` derives a name account offline, `normalizeSkrName` turns `'Alice.skr'` into the bare label `'alice'`, and `decodeNameRecordHeader` and `decodeMainDomain` decode raw account bytes offline. Also exports the `ANS_PROGRAM_ADDRESS`, `ANS_ROOT`, `NAME_HOUSE_PROGRAM_ADDRESS`, `SKR_PARENT`, `SKR_TLD_HOUSE` and `TLD_HOUSE_PROGRAM_ADDRESS` constants. NFT-wrapped names are out of scope and make the resolver throw.
