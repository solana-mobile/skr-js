# @solana-mobile/skr-genesis-token

## 1.0.0

### Major Changes

- 35ac51d: First release. Verifies Seeker Genesis Tokens on mainnet with `@solana/kit`: `getSeekerGenesisTokens` lists the tokens a wallet holds with their member numbers and token accounts, `hasSeekerGenesisToken` answers whether it holds one, `isSeekerGenesisToken` checks a single mint with one `getAccountInfo` request, and `isSeekerGenesisTokenMint` and `decodeSeekerGenesisTokenMint` check raw mint bytes offline by decoding the `TokenGroupMember` and `MetadataPointer` extensions. Also exports the `SGT_GROUP_ADDRESS` and `TOKEN_2022_PROGRAM_ADDRESS` constants.
