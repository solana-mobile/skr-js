# @solana-mobile/skr-domain

Resolve `.skr` domains with [`@solana/kit`](https://github.com/anza-xyz/kit). Reads mainnet only.

```sh
npm install @solana-mobile/skr-domain @solana/kit
```

A `.skr` name such as `alice.skr` is a name on the [AllDomains](https://alldomains.id) name service under the `.skr` top-level domain. Every name is a name account owned by the AllDomains name service program, at a program-derived address computed from the SHA-256 hash of the label and the address of the `.skr` parent name (`SKR_PARENT`). The owner of the name sits in the fixed 200-byte header of that account, so resolving a name takes a single `getAccountInfo` request, and deriving the name account needs no RPC at all. The functions that read from an RPC take a kit `Rpc` typed with only the methods they call, default to the `confirmed` commitment, and pass an optional `AbortSignal` through to every request. Invalid input throws a plain `Error`, RPC errors propagate untouched, and `null` means not found: the name is not registered, has expired, or the wallet has no primary name.

## Usage

### Resolve a name to its owner

```ts
import { resolveSkrDomain } from '@solana-mobile/skr-domain'
import { createSolanaRpc } from '@solana/kit'

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com')

const domain = await resolveSkrDomain(rpc, 'beeman.skr')
if (domain) {
  console.log(domain.owner) // 2c43Cag8oYcLKdSDKde9dj632LpejDAXB6DF32z9Ef7P
  console.log(domain.nameAccount) // 52ADjN72dV5q1ktf222M3dmpAwMAanX3CcTgEKfBJGiv
  console.log(domain.expiresAt) // null: never expires, or a bigint of unix seconds
}
```

The name is normalized first: `'Beeman.skr'`, `' beeman '` and `'beeman'` all resolve the same name. A name that has expired resolves to `null`. A name whose account is not a `.skr` name resolves to `null` too.

### Get a wallet's primary name

```ts
import { getPrimarySkrDomain } from '@solana-mobile/skr-domain'
import { address, createSolanaRpc } from '@solana/kit'

const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com')
const wallet = address('2c43Cag8oYcLKdSDKde9dj632LpejDAXB6DF32z9Ef7P')

console.log(await getPrimarySkrDomain(rpc, wallet, { commitment: 'finalized' })) // 'beeman.skr' or null
```

A wallet picks its primary name once, which creates a `MainDomain` account under the TLD House program. That account is not updated when the name is transferred or expires, so `getPrimarySkrDomain` resolves the name forward and returns it only when `wallet` still owns it. Two `getAccountInfo` requests at most; a wallet without a primary name, or whose primary name is under another TLD, resolves to `null` after one.

### Derive a name address offline

```ts
import { getSkrNameAddress, normalizeSkrName } from '@solana-mobile/skr-domain'

console.log(normalizeSkrName('Beeman.skr')) // 'beeman'
console.log(await getSkrNameAddress('Beeman.skr')) // 52ADjN72dV5q1ktf222M3dmpAwMAanX3CcTgEKfBJGiv
```

`decodeNameRecordHeader` and `decodeMainDomain` decode raw account bytes from any source into the same fields the RPC functions use, and return `null` for bytes that do not fit.

## Adapting to other SDKs

The API takes and returns base58 strings under kit's `Address` type, and expiry times as `bigint` seconds or `null` for a name that never expires. Callers on another SDK pass their public keys as plain base58 strings and wrap the returned strings in their own key type. The offline functions take a `Uint8Array` of raw account data, which every SDK can produce from an account fetch. Only the RPC-backed functions need a kit `Rpc`, which `createSolanaRpc(url)` builds from any mainnet endpoint URL.

## React Native

Deriving a name address hashes the label with WebCrypto SHA-256 (`crypto.subtle.digest`), which Bun, Node 20+ and browsers provide but React Native does not. Expo and React Native apps install [`react-native-quick-crypto`](https://github.com/margelo/react-native-quick-crypto) and call its `install()` once at startup, before this package is imported, the way the Solana Mobile Expo templates do in their [`polyfill.js`](https://github.com/solana-mobile/templates/blob/main/mobile/expo-kit-anchor/polyfill.js).

## Out of scope

- Names wrapped as NFTs through the AllDomains Name House. None of the `.skr` names are wrapped today; should one appear, `resolveSkrDomain` throws instead of returning the NFT record as the owner.
- Subdomains such as `pay.alice.skr`, and names under other TLDs. `normalizeSkrName` rejects both.
- Grace periods. A name is treated as unregistered the second it expires.
- Listing every name a wallet owns. Only the primary name is looked up.

## License

Apache-2.0
