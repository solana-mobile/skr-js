import { describe, expect, test } from 'bun:test'

import { address, createSolanaRpc } from '@solana/kit'

import { getSeekerGenesisTokens, hasSeekerGenesisToken, isSeekerGenesisToken } from '../src/index.ts'

const HOLDER = address('D2ehKLUQApN8ZxcANjwuTJC7bk7BMJn2voofXy17tCrs')
const PYUSD_MINT = address('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo')
const SGT_MINT = address('5mXbkqKz883aufhAsx3p5Z1NcvD2ppZbdTTznM6oUKLj')
const SGT_TOKEN_ACCOUNT = address('BLJGXXKnNdZEaXTGqZaaNoZ1UkkbD1dXht8DjVz2eeZV')

describe.skipIf(!process.env.SKR_LIVE_TESTS)('mainnet', () => {
  const rpc = createSolanaRpc(process.env.SKR_RPC_URL ?? 'https://api.mainnet-beta.solana.com')

  test('getSeekerGenesisTokens lists the holder token', async () => {
    await expect(getSeekerGenesisTokens(rpc, HOLDER)).resolves.toContainEqual({
      memberNumber: 20n,
      mint: SGT_MINT,
      tokenAccount: SGT_TOKEN_ACCOUNT,
    })
  })

  test('hasSeekerGenesisToken is true for the holder', async () => {
    await expect(hasSeekerGenesisToken(rpc, HOLDER)).resolves.toBe(true)
  })

  test('isSeekerGenesisToken is true for the Seeker Genesis Token mint', async () => {
    await expect(isSeekerGenesisToken(rpc, SGT_MINT)).resolves.toBe(true)
  })

  test('isSeekerGenesisToken is false for PYUSD', async () => {
    await expect(isSeekerGenesisToken(rpc, PYUSD_MINT)).resolves.toBe(false)
  })
})
