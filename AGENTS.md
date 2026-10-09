# skr-js

Two npm packages for Seeker apps, built on `@solana/kit`:

- `packages/skr-domain`: resolve `.skr` domains (AllDomains) and find a wallet's primary `.skr` name.
- `packages/skr-genesis-token`: verify Seeker Genesis Tokens (Token-2022 NFTs, one per device).

## Commands

- `bun run ci`: build, lint, check-types and test, the same as CI and the pre-push hook.
- `bun run lint:fix`: oxlint with fixes, then oxfmt.
- `bun test`: all tests. `SKR_LIVE_TESTS=1 bun test` also runs the tests that hit mainnet. `SKR_RPC_URL` overrides the endpoint.
- `bun scripts/capture-fixture.ts account <address>`: capture an account for `test/fixtures/`.
- `bun changeset`: add a release note. Every PR that changes a package needs one.

## Conventions

- **Kit only.** The runtime dependency is `@solana/kit`, declared as a peer dependency. Functions take a kit `Rpc` typed with only the RPC methods they call, accept `Address`, and return `Address`, `bigint`, `string`, `null` or small objects of those.
- **Mainnet only.** Both features live on mainnet. Resolve against mainnet even when the app targets devnet. Call it `mainnet` in code, docs and flags; the only place `mainnet-beta` appears is inside the public RPC URL.
- **Fixtures, not mocks of logic.** Capture account data once from mainnet with `scripts/capture-fixture.ts` and store it under `test/fixtures/` with the address and capture date. Decoders are tested offline against those bytes. RPC-level functions are tested with a fake transport returning canned JSON-RPC responses captured the same way.
- **Live tests are opt-in.** `describe.skipIf(!process.env.SKR_LIVE_TESTS)`. CI never sets it.
- **Errors.** Invalid input throws a plain `Error`. RPC errors propagate untouched. `null` or `false` means not found.
- **ESM only.** Each package ships `dist/index.js` and `dist/index.d.ts`, built with tsdown from `src/index.ts`. `isolatedDeclarations` is on, so every export carries an explicit type.
- **Ordering.** Lists, object keys, exports, imports and table rows are sorted alphabetically unless order is semantic. `sort-keys` and `sortImports` enforce it.
- **Tests.** `bun test`, files in `packages/<name>/test/*.test.ts`, fixtures as JSON in `packages/<name>/test/fixtures/`.
- **READMEs.** Install, three usage examples, and a short "Adapting to other SDKs" section: the API takes and returns base58 strings under the `Address` type, so callers on another SDK wrap values on their side.
- **Releases.** Changesets with independent versions. Packages start at `0.0.0`; the PR that implements a package carries a `major` changeset so its first release is `1.0.0`.
