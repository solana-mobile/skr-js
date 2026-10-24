import {
  AccountRole,
  address,
  addEncoderSizePrefix,
  getBytesEncoder,
  getStructEncoder,
  getU32Encoder,
  getUtf8Encoder,
  type AccountMeta,
  type AccountSignerMeta,
  type Address,
  type Instruction,
  type TransactionSigner,
} from '@solana/kit'

import { assertAddressInput } from './assert.ts'
import {
  ANS_PROGRAM_ADDRESS,
  SKR_PARENT,
  SKR_TLD_HOUSE,
  TLD_HOUSE_PROGRAM_ADDRESS,
  TLD_HOUSE_STATE,
} from './constants.ts'
import { getMainDomainAddress, getSkrNameAddress, getSkrReverseAddress, hashName } from './derive.ts'
import { normalizeSkrName } from './normalize.ts'

/** Anchor discriminator of the `set_main_domain` instruction of the TLD House program. */
const SET_MAIN_DOMAIN_DISCRIMINATOR = new Uint8Array([135, 132, 229, 79, 45, 195, 204, 248])
/** TLD the instruction stores for a `.skr` name, dot included. */
const SKR_TLD = '.skr'
/** The System program, which creates the `MainDomain` account the first time a wallet picks a name. */
const SYSTEM_PROGRAM_ADDRESS: Address = address('11111111111111111111111111111111')

const u32Encoder = getU32Encoder()
// Field order is the program's, not alphabetical.
const argsEncoder = getStructEncoder([
  ['domain', addEncoderSizePrefix(getUtf8Encoder(), u32Encoder)],
  ['hashedName', addEncoderSizePrefix(getBytesEncoder(), u32Encoder)],
  ['tld', addEncoderSizePrefix(getUtf8Encoder(), u32Encoder)],
  ['hashedReverseLookup', addEncoderSizePrefix(getBytesEncoder(), u32Encoder)],
])

/**
 * The signing owner account of a primary-name instruction. A `TransactionSigner` is attached so kit's
 * `signTransactionMessageWithSigners` picks it up. Throws a plain `Error` for an invalid address.
 */
export function getOwnerAccountMeta(owner: Address | TransactionSigner): AccountMeta | AccountSignerMeta {
  if (typeof owner === 'string') {
    assertAddressInput(owner, 'owner')
    return { address: owner, role: AccountRole.WRITABLE_SIGNER }
  }
  assertAddressInput(owner.address, 'owner')
  return { address: owner.address, role: AccountRole.WRITABLE_SIGNER, signer: owner }
}

/** Input of `getSetPrimarySkrDomainInstruction`. */
export type SetPrimarySkrDomainInput<TOwner extends string = string> = {
  /** The `.skr` name to make primary, such as `'alice.skr'` or `'alice'`. */
  name: string
  /** Wallet that owns the name. It signs and pays for the `MainDomain` account the first time. */
  owner: Address<TOwner> | TransactionSigner<TOwner>
}

/**
 * Builds the TLD House instruction that makes `name` the primary `.skr` name of `owner`, the name
 * `getPrimarySkrDomain` returns from then on.
 *
 * Offline: derives every account without an RPC. The program rejects the transaction unless `owner`
 * owns the name, so check that with `resolveSkrDomain` first. The first call creates the wallet's
 * `MainDomain` account, which costs about 0.0015 SOL of rent; later calls overwrite it. A wallet has
 * one `MainDomain` account across every AllDomains TLD, so this replaces a primary name under another
 * TLD too. Pass a
 * `TransactionSigner` as `owner` to have kit's `signTransactionMessageWithSigners` pick it up.
 */
export async function getSetPrimarySkrDomainInstruction<TOwner extends string = string>(
  input: SetPrimarySkrDomainInput<TOwner>,
): Promise<Instruction> {
  const ownerMeta = getOwnerAccountMeta(input.owner)
  const ownerAddress = ownerMeta.address
  const domain = normalizeSkrName(input.name)
  const nameAccount = await getSkrNameAddress(domain)

  const data = argsEncoder.encode({
    domain,
    hashedName: await hashName(domain),
    hashedReverseLookup: await hashName(nameAccount),
    tld: SKR_TLD,
  })

  return {
    accounts: [
      ownerMeta,
      { address: TLD_HOUSE_STATE, role: AccountRole.READONLY },
      { address: SKR_TLD_HOUSE, role: AccountRole.READONLY },
      { address: await getMainDomainAddress(ownerAddress), role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ADDRESS, role: AccountRole.READONLY },
      { address: nameAccount, role: AccountRole.READONLY },
      { address: SKR_PARENT, role: AccountRole.READONLY },
      { address: await getSkrReverseAddress(nameAccount), role: AccountRole.WRITABLE },
      { address: SYSTEM_PROGRAM_ADDRESS, role: AccountRole.READONLY },
      { address: ANS_PROGRAM_ADDRESS, role: AccountRole.READONLY },
    ],
    data: new Uint8Array([...SET_MAIN_DOMAIN_DISCRIMINATOR, ...data]),
    programAddress: TLD_HOUSE_PROGRAM_ADDRESS,
  }
}
