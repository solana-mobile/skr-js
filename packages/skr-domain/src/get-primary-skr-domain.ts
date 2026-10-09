import { getBase64Encoder, type Address, type GetAccountInfoApi, type Rpc } from '@solana/kit'

import { assertAddressInput } from './assert.ts'
import { decodeMainDomain } from './decode.ts'
import { getMainDomainAddress } from './derive.ts'
import { resolveSkrDomain } from './resolve-skr-domain.ts'
import type { SkrDomainConfig } from './types.ts'

/** TLD a `MainDomain` account stores for a `.skr` name, dot included. */
const SKR_TLD = '.skr'

/**
 * Returns the primary `.skr` name of `wallet` as `'alice.skr'`, or `null` when the wallet has not
 * picked one, picked a name under another TLD, or no longer owns the name it picked.
 *
 * The wallet's `MainDomain` account points at the name but is not updated when the name is
 * transferred or expires, so the name is resolved forward and its current owner compared with
 * `wallet` before it is returned. Two `getAccountInfo` requests at most.
 */
export async function getPrimarySkrDomain(
  rpc: Rpc<GetAccountInfoApi>,
  wallet: Address,
  config: SkrDomainConfig = {},
): Promise<string | null> {
  assertAddressInput(wallet, 'wallet')
  const { abortSignal, commitment = 'confirmed' } = config

  const mainDomainAddress = await getMainDomainAddress(wallet)
  const { value } = await rpc
    .getAccountInfo(mainDomainAddress, { commitment, encoding: 'base64' })
    .send({ abortSignal })
  if (!value) {
    return null
  }
  const mainDomain = decodeMainDomain(getBase64Encoder().encode(value.data[0]))
  if (!mainDomain || mainDomain.tld !== SKR_TLD) {
    return null
  }

  const resolved = await resolveSkrDomain(rpc, mainDomain.domain, config)
  if (!resolved || resolved.owner !== wallet) {
    return null
  }
  return `${mainDomain.domain}${SKR_TLD}`
}
