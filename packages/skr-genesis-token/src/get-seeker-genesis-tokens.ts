import {
  getBase64Encoder,
  type Address,
  type GetMultipleAccountsApi,
  type GetTokenAccountsByOwnerApi,
  type Rpc,
} from '@solana/kit'

import { assertAddressInput } from './assert.ts'
import { TOKEN_2022_PROGRAM_ADDRESS } from './constants.ts'
import { decodeSeekerGenesisTokenMint } from './decode.ts'
import type { SeekerGenesisToken, SeekerGenesisTokenConfig } from './types.ts'

/** Most addresses one `getMultipleAccounts` request accepts. */
const MINTS_PER_BATCH = 100

/**
 * Lists the Seeker Genesis Tokens held by `owner`, sorted by member number.
 *
 * Reads the owner's Token-2022 accounts, drops the empty ones, then fetches every distinct mint in
 * batches of 100 and keeps the ones that decode as a Seeker Genesis Token. A wallet without
 * Token-2022 accounts resolves to `[]` after a single request.
 */
export async function getSeekerGenesisTokens(
  rpc: Rpc<GetMultipleAccountsApi & GetTokenAccountsByOwnerApi>,
  owner: Address,
  { abortSignal, commitment = 'confirmed' }: SeekerGenesisTokenConfig = {},
): Promise<SeekerGenesisToken[]> {
  assertAddressInput(owner, 'owner')

  const tokenAccounts = await rpc
    .getTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ADDRESS }, { commitment, encoding: 'jsonParsed' })
    .send({ abortSignal })

  // A holder can move the token between their own accounts, so keep one token account per mint.
  const tokenAccountByMint = new Map<Address, Address>()
  for (const { account, pubkey } of tokenAccounts.value) {
    const { mint, tokenAmount } = account.data.parsed.info
    if (tokenAmount.amount === '0' || tokenAccountByMint.has(mint)) {
      continue
    }
    tokenAccountByMint.set(mint, pubkey)
  }
  if (tokenAccountByMint.size === 0) {
    return []
  }

  const base64Encoder = getBase64Encoder()
  const held = [...tokenAccountByMint]
  const tokens: SeekerGenesisToken[] = []
  for (let start = 0; start < held.length; start += MINTS_PER_BATCH) {
    const batch = held.slice(start, start + MINTS_PER_BATCH)
    const mints = await rpc
      .getMultipleAccounts(
        batch.map(([mint]) => mint),
        { commitment, encoding: 'base64' },
      )
      .send({ abortSignal })
    batch.forEach(([mint, tokenAccount], index) => {
      const account = mints.value[index]
      if (!account || account.owner !== TOKEN_2022_PROGRAM_ADDRESS) {
        return
      }
      const decoded = decodeSeekerGenesisTokenMint(base64Encoder.encode(account.data[0]))
      if (decoded) {
        tokens.push({ memberNumber: decoded.memberNumber, mint, tokenAccount })
      }
    })
  }

  return tokens.toSorted((a, b) => Number(a.memberNumber - b.memberNumber))
}

/** Returns `true` when `owner` holds at least one Seeker Genesis Token. */
export async function hasSeekerGenesisToken(
  rpc: Rpc<GetMultipleAccountsApi & GetTokenAccountsByOwnerApi>,
  owner: Address,
  config?: SeekerGenesisTokenConfig,
): Promise<boolean> {
  const tokens = await getSeekerGenesisTokens(rpc, owner, config)
  return tokens.length > 0
}
