import { AccountRole, type Address, type Instruction, type TransactionSigner } from '@solana/kit'

import { TLD_HOUSE_PROGRAM_ADDRESS, TLD_HOUSE_STATE } from './constants.ts'
import { getMainDomainAddress } from './derive.ts'
import { getOwnerAccountMeta } from './get-set-primary-skr-domain-instruction.ts'

/** Anchor discriminator of the `close_main_domain` instruction of the TLD House program. */
const CLOSE_MAIN_DOMAIN_DISCRIMINATOR = new Uint8Array([30, 91, 225, 42, 139, 118, 160, 134])

/** Input of `getUnsetPrimarySkrDomainInstruction`. */
export type UnsetPrimarySkrDomainInput<TOwner extends string = string> = {
  /** Wallet whose primary name to remove. It signs and gets the rent of the `MainDomain` account back. */
  owner: Address<TOwner> | TransactionSigner<TOwner>
}

/**
 * Builds the TLD House instruction that removes the primary name of `owner`, after which
 * `getPrimarySkrDomain` returns `null` for it.
 *
 * Offline: derives every account without an RPC. It closes the wallet's `MainDomain` account and
 * returns its rent to `owner`. A wallet has one `MainDomain` account across every AllDomains TLD, so
 * this removes a primary name under another TLD too. The program rejects the transaction when the
 * wallet has no primary name or when `owner` does not sign.
 */
export async function getUnsetPrimarySkrDomainInstruction<TOwner extends string = string>(
  input: UnsetPrimarySkrDomainInput<TOwner>,
): Promise<Instruction> {
  const ownerMeta = getOwnerAccountMeta(input.owner)

  return {
    accounts: [
      ownerMeta,
      { address: ownerMeta.address, role: AccountRole.READONLY },
      { address: TLD_HOUSE_STATE, role: AccountRole.READONLY },
      { address: await getMainDomainAddress(ownerMeta.address), role: AccountRole.WRITABLE },
    ],
    data: CLOSE_MAIN_DOMAIN_DISCRIMINATOR,
    programAddress: TLD_HOUSE_PROGRAM_ADDRESS,
  }
}
