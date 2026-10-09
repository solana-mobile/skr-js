import type { Address, Commitment } from '@solana/kit'

/** A `MainDomain` account of the TLD House program: the primary name a wallet picked. */
export type MainDomain = {
  /** Bare label of the name, without the TLD. */
  domain: string
  /** Name account the wallet picked as primary. */
  nameAccount: Address
  /** TLD of the name, with its leading dot, such as `.skr`. */
  tld: string
}

/** The fixed 200-byte header of an AllDomains name account. */
export type NameRecordHeader = {
  /** Class of the name. The zero address for `.skr` names. */
  class: Address
  /** Unix time in seconds at which the name was created. */
  createdAt: bigint
  /** Unix time in seconds at which the name expires. `0n` means it never expires. */
  expiresAt: bigint
  /** Whether the name is bound to its owner and cannot be transferred. */
  nonTransferable: boolean
  /** Wallet that owns the name. */
  owner: Address
  /** Parent name account. `SKR_PARENT` for `.skr` names. */
  parentName: Address
}

/** A resolved `.skr` name. */
export type SkrDomain = {
  /** Unix time in seconds at which the name expires, or `null` when it never expires. */
  expiresAt: bigint | null
  /** Name account of the name under the AllDomains name service program. */
  nameAccount: Address
  /** Wallet that owns the name. */
  owner: Address
}

/** Options accepted by every function that reads from an RPC. */
export type SkrDomainConfig = {
  /** Passed to every RPC request so the caller can cancel them. */
  abortSignal?: AbortSignal
  /** Commitment level of every RPC request. Defaults to `'confirmed'`. */
  commitment?: Commitment
}
