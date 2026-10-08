import { isAddress, type Address } from '@solana/kit'

/** Throws a plain `Error` when `value` is not a base58 address, so bad input never reaches the RPC. */
export function assertAddressInput(value: Address, name: string): void {
  if (typeof value !== 'string' || !isAddress(value)) {
    throw new Error(`${name} must be a base58 address, got ${String(value)}`)
  }
}
