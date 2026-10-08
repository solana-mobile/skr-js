# @solana-mobile/skr-genesis-token

Verify Seeker Genesis Tokens with [`@solana/kit`](https://github.com/anza-xyz/kit). Reads mainnet only.

```sh
npm install @solana-mobile/skr-genesis-token @solana/kit
```

A Seeker Genesis Token (SGT) is a Token-2022 NFT minted once per Seeker device and held in the device owner's wallet. Every SGT mint is owned by the Token-2022 program and carries two extensions that tie it to the collection: a `TokenGroupMember` extension whose `group` is the SGT group mint (`SGT_GROUP_ADDRESS`), and a `MetadataPointer` extension that points at the same group mint. Group membership is the authoritative signal, so this package verifies a token by decoding those two extensions from the mint's raw bytes rather than by trusting names, symbols or off-chain metadata. The functions that read from an RPC take a kit `Rpc` typed with only the methods they call, default to the `confirmed` commitment, and pass an optional `AbortSignal` through to every request. Invalid input throws a plain `Error`, RPC errors propagate untouched, and `false` or an empty array means the wallet or mint is not an SGT.

## Usage

### Check whether a wallet holds a Seeker Genesis Token

```ts
import { hasSeekerGenesisToken } from '@solana-mobile/skr-genesis-token'
import { address, createSolanaRpc } from '@solana/kit'

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com')
const owner = address('D2ehKLUQApN8ZxcANjwuTJC7bk7BMJn2voofXy17tCrs')

if (await hasSeekerGenesisToken(rpc, owner)) {
  console.log('Seeker holder')
}
```

### List a wallet's tokens with their member numbers

```ts
import { getSeekerGenesisTokens } from '@solana-mobile/skr-genesis-token'
import { address, createSolanaRpc } from '@solana/kit'

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com')
const owner = address('D2ehKLUQApN8ZxcANjwuTJC7bk7BMJn2voofXy17tCrs')

const tokens = await getSeekerGenesisTokens(rpc, owner, { commitment: 'finalized' })
for (const { memberNumber, mint, tokenAccount } of tokens) {
  console.log(`SGT #${memberNumber}: mint ${mint} in token account ${tokenAccount}`)
}
```

The result is sorted by `memberNumber`. Accounts with a zero balance are skipped, and a mint is listed once even when the holder has several token accounts for it.

### Verify a single mint

Online, with one `getAccountInfo` request:

```ts
import { isSeekerGenesisToken } from '@solana-mobile/skr-genesis-token'
import { address, createSolanaRpc } from '@solana/kit'

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com')
const mint = address('5mXbkqKz883aufhAsx3p5Z1NcvD2ppZbdTTznM6oUKLj')

console.log(await isSeekerGenesisToken(rpc, mint)) // true
```

Offline, from mint bytes you already have:

```ts
import { decodeSeekerGenesisTokenMint, isSeekerGenesisTokenMint } from '@solana-mobile/skr-genesis-token'

declare const mintData: Uint8Array // raw account data of a Token-2022 mint

console.log(isSeekerGenesisTokenMint(mintData)) // true or false
console.log(decodeSeekerGenesisTokenMint(mintData)) // { group, memberNumber, metadataAddress } or null
```

## Adapting to other SDKs

The API takes and returns base58 strings under kit's `Address` type, and member numbers as `bigint`. Callers on another SDK pass their public keys as plain base58 strings and wrap the returned strings in their own key type. The offline functions take a `Uint8Array` of raw mint data, which every SDK can produce from an account fetch. Only the RPC-backed functions need a kit `Rpc`, which `createSolanaRpc(url)` builds from any mainnet endpoint URL.

## Out of scope

- Pagination for wallets with thousands of Token-2022 accounts. `getSeekerGenesisTokens` reads every Token-2022 account of the wallet in one `getTokenAccountsByOwner` request, then fetches the distinct mints in batches of 100.
- Provider-specific RPC methods. Only `getAccountInfo`, `getMultipleAccounts` and `getTokenAccountsByOwner` are used, so any mainnet endpoint works.

## License

Apache-2.0
