import {
  getAddressEncoder,
  getBase64Encoder,
  getProgramDerivedAddress,
  getU64Decoder,
  getUtf8Decoder,
  type Address,
  type Base58EncodedBytes,
  type GetMultipleAccountsApi,
  type GetProgramAccountsApi,
  type Rpc,
} from '@solana/kit'

import { assertAddressInput } from './assert.ts'
import { ANS_PROGRAM_ADDRESS, SKR_PARENT, SKR_TLD_HOUSE } from './constants.ts'
import {
  NAME_RECORD_EXPIRES_AT_OFFSET,
  NAME_RECORD_HEADER_LENGTH,
  NAME_RECORD_OWNER_OFFSET,
  NAME_RECORD_PARENT_NAME_OFFSET,
} from './decode.ts'
import { hashName } from './derive.ts'
import type { SkrDomainConfig } from './types.ts'

/** Most accounts a single `getMultipleAccounts` request accepts. */
const MAX_MULTIPLE_ACCOUNTS = 100
/** Seed of a reverse-lookup account: 32 zero bytes in place of a parent. */
const NO_PARENT = new Uint8Array(32)

/** Reverse-lookup account of a `.skr` name account, which stores the name's label. */
async function getSkrReverseAddress(nameAccount: Address): Promise<Address> {
  const [reverse] = await getProgramDerivedAddress({
    programAddress: ANS_PROGRAM_ADDRESS,
    seeds: [await hashName(nameAccount), getAddressEncoder().encode(SKR_TLD_HOUSE), NO_PARENT],
  })
  return reverse
}

/**
 * Returns every live `.skr` name `owner` holds as `'alice.skr'`, sorted. A name whose reverse-lookup
 * account is missing or has no label is skipped, so an empty array does not prove the wallet holds
 * no names. Names wrapped as NFTs are not included.
 *
 * One `getProgramAccounts` request finds the name accounts, then `getMultipleAccounts` reads their
 * reverse-lookup accounts 100 at a time, one request after another: anyone can send names to a
 * wallet, so the request count is not the caller's to control.
 */
export async function getSkrDomains(
  rpc: Rpc<GetMultipleAccountsApi & GetProgramAccountsApi>,
  owner: Address,
  config: SkrDomainConfig = {},
): Promise<string[]> {
  assertAddressInput(owner, 'owner')
  const { abortSignal, commitment = 'confirmed' } = config

  const accounts = await rpc
    .getProgramAccounts(ANS_PROGRAM_ADDRESS, {
      commitment,
      dataSlice: { length: 8, offset: NAME_RECORD_EXPIRES_AT_OFFSET },
      encoding: 'base64',
      filters: [
        {
          memcmp: {
            bytes: SKR_PARENT as string as Base58EncodedBytes,
            encoding: 'base58',
            offset: BigInt(NAME_RECORD_PARENT_NAME_OFFSET),
          },
        },
        {
          memcmp: {
            bytes: owner as string as Base58EncodedBytes,
            encoding: 'base58',
            offset: BigInt(NAME_RECORD_OWNER_OFFSET),
          },
        },
      ],
    })
    .send({ abortSignal })

  const nowSeconds = BigInt(Math.floor(Date.now() / 1000))
  const live = accounts.filter(({ account }) => {
    const expiresAt = getU64Decoder().decode(getBase64Encoder().encode(account.data[0]))
    return expiresAt === 0n || expiresAt >= nowSeconds
  })

  const names: string[] = []
  for (let start = 0; start < live.length; start += MAX_MULTIPLE_ACCOUNTS) {
    const reverseAddresses = await Promise.all(
      live.slice(start, start + MAX_MULTIPLE_ACCOUNTS).map(({ pubkey }) => getSkrReverseAddress(pubkey)),
    )
    const { value } = await rpc
      .getMultipleAccounts(reverseAddresses, { commitment, encoding: 'base64' })
      .send({ abortSignal })
    for (const account of value) {
      if (!account) {
        continue
      }
      const data = getBase64Encoder().encode(account.data[0])
      const end = data.indexOf(0, NAME_RECORD_HEADER_LENGTH)
      const label = getUtf8Decoder().decode(data.slice(NAME_RECORD_HEADER_LENGTH, end === -1 ? undefined : end))
      if (label) {
        names.push(`${label}.skr`)
      }
    }
  }
  return names.sort()
}
