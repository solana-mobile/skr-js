import { getBase64Encoder, type Address, type GetAccountInfoApi, type Rpc } from '@solana/kit'

import { assertAddressInput } from './assert.ts'
import { TOKEN_2022_PROGRAM_ADDRESS } from './constants.ts'
import { isSeekerGenesisTokenMint } from './decode.ts'
import type { SeekerGenesisTokenConfig } from './types.ts'

/**
 * Returns `true` when `mint` is a Seeker Genesis Token mint, after a single `getAccountInfo` request.
 * A missing account or one not owned by Token-2022 resolves to `false`.
 */
export async function isSeekerGenesisToken(
  rpc: Rpc<GetAccountInfoApi>,
  mint: Address,
  { abortSignal, commitment = 'confirmed' }: SeekerGenesisTokenConfig = {},
): Promise<boolean> {
  assertAddressInput(mint, 'mint')

  const { value } = await rpc.getAccountInfo(mint, { commitment, encoding: 'base64' }).send({ abortSignal })
  if (!value || value.owner !== TOKEN_2022_PROGRAM_ADDRESS) {
    return false
  }
  return isSeekerGenesisTokenMint(getBase64Encoder().encode(value.data[0]))
}
