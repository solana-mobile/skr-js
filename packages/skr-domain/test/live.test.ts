import { describe, expect, test } from 'bun:test'

import { address, createSolanaRpc } from '@solana/kit'

import { getPrimarySkrDomain, resolveSkrDomain } from '../src/index.ts'

const BEEMAN_NAME_ACCOUNT = address('52ADjN72dV5q1ktf222M3dmpAwMAanX3CcTgEKfBJGiv')
const BEEMAN_WALLET = address('2c43Cag8oYcLKdSDKde9dj632LpejDAXB6DF32z9Ef7P')
/** A fresh wallet that has never picked a primary name. */
const EMPTY_WALLET = address('9ro9p11F5Wr6aVCem1PkJn6V78AM98zGE25bqgGpVahQ')

describe.skipIf(!process.env.SKR_LIVE_TESTS)('mainnet', () => {
  const rpc = createSolanaRpc(process.env.SKR_RPC_URL ?? 'https://api.mainnet-beta.solana.com')

  test('resolveSkrDomain resolves beeman.skr to its owner', async () => {
    await expect(resolveSkrDomain(rpc, 'beeman.skr')).resolves.toEqual({
      expiresAt: null,
      nameAccount: BEEMAN_NAME_ACCOUNT,
      owner: BEEMAN_WALLET,
    })
  })

  test('resolveSkrDomain is null for a name nobody registered', async () => {
    await expect(resolveSkrDomain(rpc, 'no-such-name-9ro9p11f5wr6avcem1pkjn6v78am98zge25bqggpvahq')).resolves.toBeNull()
  })

  test('getPrimarySkrDomain is beeman.skr for its owner', async () => {
    await expect(getPrimarySkrDomain(rpc, BEEMAN_WALLET)).resolves.toBe('beeman.skr')
  })

  test('getPrimarySkrDomain is null for a wallet without a primary name', async () => {
    await expect(getPrimarySkrDomain(rpc, EMPTY_WALLET)).resolves.toBeNull()
  })
})
