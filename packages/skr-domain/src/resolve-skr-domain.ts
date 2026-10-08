import { getBase64Encoder, type GetAccountInfoApi, type Rpc } from '@solana/kit'

import { SKR_PARENT } from './constants.ts'
import { decodeNameRecordHeader } from './decode.ts'
import { getSkrNameAddress, getSkrNftRecordAddress } from './derive.ts'
import type { SkrDomain, SkrDomainConfig } from './types.ts'

/**
 * Resolves a `.skr` name as of the unix time `nowSeconds`. `resolveSkrDomain` passes the current
 * time; tests pass their own.
 */
export async function resolveSkrDomainAt(
  rpc: Rpc<GetAccountInfoApi>,
  name: string,
  nowSeconds: bigint,
  { abortSignal, commitment = 'confirmed' }: SkrDomainConfig = {},
): Promise<SkrDomain | null> {
  const nameAccount = await getSkrNameAddress(name)

  const { value } = await rpc.getAccountInfo(nameAccount, { commitment, encoding: 'base64' }).send({ abortSignal })
  if (!value) {
    return null
  }
  const header = decodeNameRecordHeader(getBase64Encoder().encode(value.data[0]))
  if (!header || header.parentName !== SKR_PARENT) {
    return null
  }
  if (header.expiresAt !== 0n && header.expiresAt < nowSeconds) {
    return null
  }
  if (header.owner === (await getSkrNftRecordAddress(nameAccount))) {
    throw new Error('NFT-wrapped .skr names are not supported')
  }
  return { expiresAt: header.expiresAt === 0n ? null : header.expiresAt, nameAccount, owner: header.owner }
}

/**
 * Resolves a `.skr` name to its owner with one `getAccountInfo` request. Accepts `'alice'` and
 * `'Alice.skr'` alike. Resolves to `null` when the name is not registered, has expired, or its
 * account is not a `.skr` name. Throws a plain `Error` for input that is not a single `.skr` label,
 * and for a name wrapped as an NFT, which this package does not support.
 */
export function resolveSkrDomain(
  rpc: Rpc<GetAccountInfoApi>,
  name: string,
  config?: SkrDomainConfig,
): Promise<SkrDomain | null> {
  return resolveSkrDomainAt(rpc, name, BigInt(Math.floor(Date.now() / 1000)), config)
}
