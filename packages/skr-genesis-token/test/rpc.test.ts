import { describe, expect, test } from 'bun:test'

import { address, type Address } from '@solana/kit'

import {
  getSeekerGenesisTokens,
  hasSeekerGenesisToken,
  isSeekerGenesisToken,
  TOKEN_2022_PROGRAM_ADDRESS,
} from '../src/index.ts'
import { createFakeRpc, type FakeRpc } from './fake-rpc.ts'
import missingAccount from './fixtures/missing-account.json'
import multipleAccounts from './fixtures/multiple-accounts.json'
import pyusdMint from './fixtures/pyusd-mint.json'
import sgtMint from './fixtures/sgt-mint.json'
import tokenAccountsByOwnerEmpty from './fixtures/token-accounts-by-owner-empty.json'
import tokenAccountsByOwner from './fixtures/token-accounts-by-owner.json'

const EMPTY_WALLET = address('E5kK2JsZEt9E9a6pYKtJ9vgD4FbGmc9cN2P5hSEp3Rk1')
const HOLDER = address('D2ehKLUQApN8ZxcANjwuTJC7bk7BMJn2voofXy17tCrs')
const PYUSD_MINT = address('2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo')
const SGT_MINT = address('5mXbkqKz883aufhAsx3p5Z1NcvD2ppZbdTTznM6oUKLj')
const SGT_TOKEN_ACCOUNT = address('BLJGXXKnNdZEaXTGqZaaNoZ1UkkbD1dXht8DjVz2eeZV')
/** Queried as a "mint" to get back the SGT mint bytes under an owner that is not Token-2022. */
const WRONG_OWNER_MINT = address('DomgenqvpkvdfQyXVTXt1kdakFsM4X5wYj4qwMnsVMB4')
/** The legacy token program, an owner that is not Token-2022. */
const TOKEN_PROGRAM_ADDRESS = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')

/** The captured SGT mint with its owner swapped to the legacy token program. */
const sgtMintWithWrongOwner = {
  ...sgtMint.result.result,
  value: { ...sgtMint.result.result.value, owner: TOKEN_PROGRAM_ADDRESS },
}

const accountInfoByAddress: Record<string, unknown> = {
  [PYUSD_MINT]: pyusdMint.result.result,
  [SGT_MINT]: sgtMint.result.result,
  [WRONG_OWNER_MINT]: sgtMintWithWrongOwner,
}

function createRpc(): FakeRpc {
  return createFakeRpc({
    getAccountInfo: ([target]) =>
      (typeof target === 'string' && accountInfoByAddress[target]) || missingAccount.result.result,
    getMultipleAccounts: () => multipleAccounts.result.result,
    getTokenAccountsByOwner: ([owner]) =>
      owner === HOLDER ? tokenAccountsByOwner.result.result : tokenAccountsByOwnerEmpty.result.result,
  })
}

describe('getSeekerGenesisTokens', () => {
  test('lists the holder token with its member number and token account', async () => {
    const { calls, rpc } = createRpc()
    await expect(getSeekerGenesisTokens(rpc, HOLDER)).resolves.toEqual([
      { memberNumber: 20n, mint: SGT_MINT, tokenAccount: SGT_TOKEN_ACCOUNT },
    ])
    expect(calls.map((call) => call.method)).toEqual(['getTokenAccountsByOwner', 'getMultipleAccounts'])
  })

  test('ignores the zero-balance Token-2022 account of the holder', async () => {
    const { calls, rpc } = createRpc()
    const zeroBalanceMints = tokenAccountsByOwner.result.result.value
      .filter((entry) => entry.account.data.parsed.info.tokenAmount.amount === '0')
      .map((entry) => entry.account.data.parsed.info.mint)
    expect(zeroBalanceMints).not.toHaveLength(0)

    await getSeekerGenesisTokens(rpc, HOLDER)
    expect(calls[1]?.params[0]).toEqual([SGT_MINT])
  })

  test('returns [] for a wallet without Token-2022 accounts after a single request', async () => {
    const { calls, rpc } = createRpc()
    await expect(getSeekerGenesisTokens(rpc, EMPTY_WALLET)).resolves.toEqual([])
    expect(calls.map((call) => call.method)).toEqual(['getTokenAccountsByOwner'])
  })

  test('sends the default commitment of confirmed', async () => {
    const { calls, rpc } = createRpc()
    await getSeekerGenesisTokens(rpc, HOLDER)
    expect(calls[0]?.params).toEqual([
      HOLDER,
      { programId: TOKEN_2022_PROGRAM_ADDRESS },
      { commitment: 'confirmed', encoding: 'jsonParsed' },
    ])
    expect(calls[1]?.params).toEqual([[SGT_MINT], { commitment: 'confirmed', encoding: 'base64' }])
  })

  test('sends the configured commitment', async () => {
    const { calls, rpc } = createRpc()
    await getSeekerGenesisTokens(rpc, HOLDER, { commitment: 'processed' })
    expect(calls[0]?.params[2]).toEqual({ commitment: 'processed', encoding: 'jsonParsed' })
    expect(calls[1]?.params[1]).toEqual({ commitment: 'processed', encoding: 'base64' })
  })

  test('passes the abort signal through and rejects once aborted', async () => {
    const { calls, rpc } = createRpc()
    const controller = new AbortController()
    controller.abort()
    await expect(getSeekerGenesisTokens(rpc, HOLDER, { abortSignal: controller.signal })).rejects.toThrow('aborted')
    expect(calls[0]?.signal).toBe(controller.signal)
  })

  test('throws a plain Error for an owner that is not an address', async () => {
    const { calls, rpc } = createRpc()
    await expect(getSeekerGenesisTokens(rpc, 'not an address' as Address)).rejects.toThrow(Error)
    expect(calls).toHaveLength(0)
  })
})

describe('hasSeekerGenesisToken', () => {
  test('is true for the holder', async () => {
    const { rpc } = createRpc()
    await expect(hasSeekerGenesisToken(rpc, HOLDER)).resolves.toBe(true)
  })

  test('is false for a wallet without Token-2022 accounts', async () => {
    const { rpc } = createRpc()
    await expect(hasSeekerGenesisToken(rpc, EMPTY_WALLET)).resolves.toBe(false)
  })
})

describe('isSeekerGenesisToken', () => {
  test('is true for the captured Seeker Genesis Token mint', async () => {
    const { calls, rpc } = createRpc()
    await expect(isSeekerGenesisToken(rpc, SGT_MINT)).resolves.toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.params).toEqual([SGT_MINT, { commitment: 'confirmed', encoding: 'base64' }])
  })

  test('is false for PYUSD', async () => {
    const { rpc } = createRpc()
    await expect(isSeekerGenesisToken(rpc, PYUSD_MINT)).resolves.toBe(false)
  })

  test('is false for a missing account', async () => {
    const { rpc } = createRpc()
    await expect(isSeekerGenesisToken(rpc, EMPTY_WALLET)).resolves.toBe(false)
  })

  test('is false for an account that Token-2022 does not own', async () => {
    const { rpc } = createRpc()
    await expect(isSeekerGenesisToken(rpc, WRONG_OWNER_MINT)).resolves.toBe(false)
  })

  test('sends the configured commitment', async () => {
    const { calls, rpc } = createRpc()
    await isSeekerGenesisToken(rpc, SGT_MINT, { commitment: 'processed' })
    expect(calls[0]?.params[1]).toEqual({ commitment: 'processed', encoding: 'base64' })
  })

  test('passes the abort signal through and rejects once aborted', async () => {
    const { calls, rpc } = createRpc()
    const controller = new AbortController()
    controller.abort()
    await expect(isSeekerGenesisToken(rpc, SGT_MINT, { abortSignal: controller.signal })).rejects.toThrow('aborted')
    expect(calls[0]?.signal).toBe(controller.signal)
  })

  test('throws a plain Error for a mint that is not an address', async () => {
    const { calls, rpc } = createRpc()
    await expect(isSeekerGenesisToken(rpc, 'not an address' as Address)).rejects.toThrow(Error)
    expect(calls).toHaveLength(0)
  })
})
