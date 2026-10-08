import type { Address, Commitment } from '@solana/kit'

/** A Seeker Genesis Token held by a wallet. */
export type SeekerGenesisToken = {
  /** Position of the token in the Seeker Genesis Token group, read from its `TokenGroupMember` extension. */
  memberNumber: bigint
  /** Mint of the token. */
  mint: Address
  /** Token account of the wallet that holds the token. */
  tokenAccount: Address
}

/** Options accepted by every function that reads from an RPC. */
export type SeekerGenesisTokenConfig = {
  /** Passed to every RPC request so the caller can cancel them. */
  abortSignal?: AbortSignal
  /** Commitment level of every RPC request. Defaults to `'confirmed'`. */
  commitment?: Commitment
}
