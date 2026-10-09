# skr-js

TypeScript packages for Seeker apps, built on [`@solana/kit`](https://github.com/anza-xyz/kit).

| Package                                                          | Description                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| [`@solana-mobile/skr-domain`](packages/skr-domain)               | Resolve `.skr` domains and find a wallet's primary name. |
| [`@solana-mobile/skr-genesis-token`](packages/skr-genesis-token) | Verify Seeker Genesis Tokens.                            |

## Development

```sh
bun install
bun run ci
```

`bun run ci` builds, lints, type-checks and tests, the same as CI and the pre-push hook. See [AGENTS.md](AGENTS.md) for the conventions.

## License

Apache-2.0
