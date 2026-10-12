import { describe, expect, test } from 'bun:test'

import {
  address,
  getAddressDecoder,
  getAddressEncoder,
  getBase64Decoder,
  getBase64Encoder,
  getU32Encoder,
  getU64Encoder,
  getUtf8Encoder,
  type Address,
} from '@solana/kit'

import { getSkrNftRecordAddress } from '../src/derive.ts'
import { getPrimarySkrDomain, getSkrDomains, resolveSkrDomain } from '../src/index.ts'
import { createFakeRpc, type FakeRpc } from './fake-rpc.ts'
import beemanMainDomain from './fixtures/beeman-main-domain.json'
import beemanNameAccount from './fixtures/beeman-name-account.json'
import beemanProgramAccounts from './fixtures/beeman-program-accounts.json'
import beemanReverseAccounts from './fixtures/beeman-reverse-accounts.json'
import emptyProgramAccounts from './fixtures/empty-program-accounts.json'
import missingAccount from './fixtures/missing-account.json'

const BEEMAN_MAIN_DOMAIN = address('EFkEVbebRnZqrmhE4EtNubncEmS5VwtKfbWgegdZq91T')
const BEEMAN_NAME_ACCOUNT = address('52ADjN72dV5q1ktf222M3dmpAwMAanX3CcTgEKfBJGiv')
const BEEMAN_WALLET = address('2c43Cag8oYcLKdSDKde9dj632LpejDAXB6DF32z9Ef7P')
/** A fresh wallet that has never picked a primary name. */
const EMPTY_WALLET = address('9ro9p11F5Wr6aVCem1PkJn6V78AM98zGE25bqgGpVahQ')
const MAIN_DOMAIN_DISCRIMINATOR = [109, 239, 227, 199, 98, 226, 66, 175]
/** Offset of `expiresAt` in a name record header. */
const NAME_RECORD_EXPIRES_AT_OFFSET = 104
/** Offset of `owner` in a name record header. */
const NAME_RECORD_OWNER_OFFSET = 40

type AccountValue = (typeof beemanNameAccount)['result']['result']['value']

const beemanNameAccountBytes = new Uint8Array(
  getBase64Encoder().encode(beemanNameAccount.result.result.value.data[0] ?? ''),
)

/** The captured beeman.skr name account with its data replaced. */
function nameAccountWithData(data: Uint8Array): AccountValue {
  return { ...beemanNameAccount.result.result.value, data: [getBase64Decoder().decode(data), 'base64'] }
}

/** The captured beeman.skr name account with `expiresAt` replaced. */
function nameAccountExpiringAt(expiresAt: bigint): AccountValue {
  const data = new Uint8Array(beemanNameAccountBytes)
  data.set(getU64Encoder().encode(expiresAt), NAME_RECORD_EXPIRES_AT_OFFSET)
  return nameAccountWithData(data)
}

/** The captured beeman.skr name account with `owner` replaced. */
function nameAccountOwnedBy(owner: Address): AccountValue {
  const data = new Uint8Array(beemanNameAccountBytes)
  data.set(getAddressEncoder().encode(owner), NAME_RECORD_OWNER_OFFSET)
  return nameAccountWithData(data)
}

/** A synthetic `MainDomain` account for `nameAccount` with the given `tld` and `domain`. */
function mainDomainAccount(nameAccount: Address, tld: string, domain: string): AccountValue {
  const utf8 = getUtf8Encoder()
  const u32 = getU32Encoder()
  const tldBytes = utf8.encode(tld)
  const domainBytes = utf8.encode(domain)
  const data = new Uint8Array([
    ...MAIN_DOMAIN_DISCRIMINATOR,
    ...getAddressEncoder().encode(nameAccount),
    ...u32.encode(tldBytes.length),
    ...tldBytes,
    ...u32.encode(domainBytes.length),
    ...domainBytes,
  ])
  return { ...beemanMainDomain.result.result.value, data: [getBase64Decoder().decode(data), 'base64'] }
}

function createRpc(overrides: Record<string, AccountValue> = {}): FakeRpc {
  const accountInfoByAddress: Record<string, AccountValue> = {
    [BEEMAN_MAIN_DOMAIN]: beemanMainDomain.result.result.value,
    [BEEMAN_NAME_ACCOUNT]: beemanNameAccount.result.result.value,
    ...overrides,
  }
  return createFakeRpc({
    getAccountInfo: ([target]) => {
      const value = typeof target === 'string' ? accountInfoByAddress[target] : undefined
      return value ? { ...beemanNameAccount.result.result, value } : missingAccount.result.result
    },
  })
}

describe('resolveSkrDomain', () => {
  test('resolves beeman.skr to its owner with one request', async () => {
    const { calls, rpc } = createRpc()
    await expect(resolveSkrDomain(rpc, 'beeman.skr')).resolves.toEqual({
      expiresAt: null,
      nameAccount: BEEMAN_NAME_ACCOUNT,
      owner: BEEMAN_WALLET,
    })
    expect(calls.map((call) => call.method)).toEqual(['getAccountInfo'])
  })

  test('resolves the bare label the same way', async () => {
    const { rpc } = createRpc()
    await expect(resolveSkrDomain(rpc, 'Beeman')).resolves.toMatchObject({ owner: BEEMAN_WALLET })
  })

  test('resolves to null for a name without an account', async () => {
    const { calls, rpc } = createRpc()
    await expect(resolveSkrDomain(rpc, 'no-such-name-xyz')).resolves.toBeNull()
    expect(calls).toHaveLength(1)
  })

  test('resolves to null for a name that expired', async () => {
    const { rpc } = createRpc({ [BEEMAN_NAME_ACCOUNT]: nameAccountExpiringAt(1n) })
    await expect(resolveSkrDomain(rpc, 'beeman')).resolves.toBeNull()
  })

  test('returns the expiry of a name that has not expired', async () => {
    const expiresAt = BigInt(Math.floor(Date.now() / 1000)) + 86_400n
    const { rpc } = createRpc({ [BEEMAN_NAME_ACCOUNT]: nameAccountExpiringAt(expiresAt) })
    await expect(resolveSkrDomain(rpc, 'beeman')).resolves.toMatchObject({ expiresAt })
  })

  test('resolves to null for an account shorter than the header', async () => {
    const { rpc } = createRpc({ [BEEMAN_NAME_ACCOUNT]: nameAccountWithData(beemanNameAccountBytes.slice(0, 199)) })
    await expect(resolveSkrDomain(rpc, 'beeman')).resolves.toBeNull()
  })

  test('resolves to null for a name whose parent is not .skr', async () => {
    const data = new Uint8Array(beemanNameAccountBytes)
    data.set(getAddressEncoder().encode(BEEMAN_WALLET), 8)
    const { rpc } = createRpc({ [BEEMAN_NAME_ACCOUNT]: nameAccountWithData(data) })
    await expect(resolveSkrDomain(rpc, 'beeman')).resolves.toBeNull()
  })

  test('throws for a name wrapped as an NFT', async () => {
    const nftRecord = await getSkrNftRecordAddress(BEEMAN_NAME_ACCOUNT)
    expect<string>(nftRecord).toBe('4Y7E6kSFzR7zg8ytVHfYWRtczrUD7cMRVkTwUV2Y6Fm3')
    const { rpc } = createRpc({ [BEEMAN_NAME_ACCOUNT]: nameAccountOwnedBy(nftRecord) })
    await expect(resolveSkrDomain(rpc, 'beeman')).rejects.toThrow('NFT-wrapped .skr names are not supported')
  })

  test('sends the default commitment of confirmed', async () => {
    const { calls, rpc } = createRpc()
    await resolveSkrDomain(rpc, 'beeman')
    expect(calls[0]?.params).toEqual([BEEMAN_NAME_ACCOUNT, { commitment: 'confirmed', encoding: 'base64' }])
  })

  test('sends the configured commitment', async () => {
    const { calls, rpc } = createRpc()
    await resolveSkrDomain(rpc, 'beeman', { commitment: 'processed' })
    expect(calls[0]?.params[1]).toEqual({ commitment: 'processed', encoding: 'base64' })
  })

  test('passes the abort signal through and rejects once aborted', async () => {
    const { calls, rpc } = createRpc()
    const controller = new AbortController()
    controller.abort()
    await expect(resolveSkrDomain(rpc, 'beeman', { abortSignal: controller.signal })).rejects.toThrow('aborted')
    expect(calls[0]?.signal).toBe(controller.signal)
  })

  test('throws a plain Error for a name that is not a single .skr label', async () => {
    const { calls, rpc } = createRpc()
    await expect(resolveSkrDomain(rpc, 'a.b.skr')).rejects.toThrow(Error)
    expect(calls).toHaveLength(0)
  })
})

describe('getPrimarySkrDomain', () => {
  test('returns beeman.skr for its owner after two requests', async () => {
    const { calls, rpc } = createRpc()
    await expect(getPrimarySkrDomain(rpc, BEEMAN_WALLET)).resolves.toBe('beeman.skr')
    expect(calls.map((call) => call.params[0])).toEqual([BEEMAN_MAIN_DOMAIN, BEEMAN_NAME_ACCOUNT])
  })

  test('returns null for a wallet without a MainDomain account after one request', async () => {
    const { calls, rpc } = createRpc()
    await expect(getPrimarySkrDomain(rpc, EMPTY_WALLET)).resolves.toBeNull()
    expect(calls).toHaveLength(1)
  })

  test('returns null when the primary name is under another TLD', async () => {
    const { calls, rpc } = createRpc({
      [BEEMAN_MAIN_DOMAIN]: mainDomainAccount(BEEMAN_NAME_ACCOUNT, '.sol', 'beeman'),
    })
    await expect(getPrimarySkrDomain(rpc, BEEMAN_WALLET)).resolves.toBeNull()
    expect(calls).toHaveLength(1)
  })

  test('returns null when the MainDomain account is stale and the name has another owner', async () => {
    const { calls, rpc } = createRpc({ [BEEMAN_NAME_ACCOUNT]: nameAccountOwnedBy(EMPTY_WALLET) })
    await expect(getPrimarySkrDomain(rpc, BEEMAN_WALLET)).resolves.toBeNull()
    expect(calls).toHaveLength(2)
  })

  test('returns null when the MainDomain account is stale and the name expired', async () => {
    const { rpc } = createRpc({ [BEEMAN_NAME_ACCOUNT]: nameAccountExpiringAt(1n) })
    await expect(getPrimarySkrDomain(rpc, BEEMAN_WALLET)).resolves.toBeNull()
  })

  test('sends the default commitment of confirmed on both requests', async () => {
    const { calls, rpc } = createRpc()
    await getPrimarySkrDomain(rpc, BEEMAN_WALLET)
    expect(calls[0]?.params).toEqual([BEEMAN_MAIN_DOMAIN, { commitment: 'confirmed', encoding: 'base64' }])
    expect(calls[1]?.params).toEqual([BEEMAN_NAME_ACCOUNT, { commitment: 'confirmed', encoding: 'base64' }])
  })

  test('sends the configured commitment on both requests', async () => {
    const { calls, rpc } = createRpc()
    await getPrimarySkrDomain(rpc, BEEMAN_WALLET, { commitment: 'processed' })
    expect(calls[0]?.params[1]).toEqual({ commitment: 'processed', encoding: 'base64' })
    expect(calls[1]?.params[1]).toEqual({ commitment: 'processed', encoding: 'base64' })
  })

  test('passes the abort signal through and rejects once aborted', async () => {
    const { calls, rpc } = createRpc()
    const controller = new AbortController()
    controller.abort()
    await expect(getPrimarySkrDomain(rpc, BEEMAN_WALLET, { abortSignal: controller.signal })).rejects.toThrow('aborted')
    expect(calls[0]?.signal).toBe(controller.signal)
  })

  test('throws a plain Error for a wallet that is not an address', async () => {
    const { calls, rpc } = createRpc()
    await expect(getPrimarySkrDomain(rpc, 'not an address' as Address)).rejects.toThrow(Error)
    expect(calls).toHaveLength(0)
  })
})

type ProgramAccount = (typeof beemanProgramAccounts)['result']['result'][number]
type ReverseAccount = (typeof beemanReverseAccounts)['result']['result']['value'][number]

const beemanProgramAccount = beemanProgramAccounts.result.result[0] as ProgramAccount
const beemanReverseAccount = beemanReverseAccounts.result.result.value[0] as ReverseAccount

/** A program account at a synthetic address whose sliced data is `expiresAt`. */
function programAccount(index: number, expiresAt = 0n): ProgramAccount {
  return {
    account: {
      ...beemanProgramAccount.account,
      data: [getBase64Decoder().decode(getU64Encoder().encode(expiresAt)), 'base64'],
    },
    pubkey: getAddressDecoder().decode(new Uint8Array(32).fill(index)),
  }
}

/** The captured beeman.skr reverse account with its label replaced. */
function reverseAccount(label: string): ReverseAccount {
  const data = new Uint8Array([
    ...getBase64Encoder()
      .encode(beemanReverseAccount.data[0] ?? '')
      .slice(0, 200),
    ...getUtf8Encoder().encode(label),
  ])
  return { ...beemanReverseAccount, data: [getBase64Decoder().decode(data), 'base64'] }
}

function createDomainsRpc(
  programAccounts: ProgramAccount[],
  reverse: (index: number) => ReverseAccount | null = () => beemanReverseAccount,
): FakeRpc {
  let index = 0
  return createFakeRpc({
    getMultipleAccounts: ([addresses]) => ({
      ...beemanReverseAccounts.result.result,
      value: (addresses as string[]).map(() => reverse(index++)),
    }),
    getProgramAccounts: () => programAccounts,
  })
}

describe('getSkrDomains', () => {
  test('returns beeman.skr for its owner with the captured requests', async () => {
    const { calls, rpc } = createDomainsRpc(beemanProgramAccounts.result.result)
    await expect(getSkrDomains(rpc, BEEMAN_WALLET)).resolves.toEqual(['beeman.skr'])
    // The fake transport sees params before kit turns bigints into JSON numbers.
    const sent = JSON.parse(
      JSON.stringify(
        calls.map(({ method, params }) => ({ method, params })),
        (_, value: unknown) => (typeof value === 'bigint' ? Number(value) : value),
      ),
    )
    expect(sent).toEqual([
      { method: 'getProgramAccounts', params: beemanProgramAccounts.params },
      { method: 'getMultipleAccounts', params: beemanReverseAccounts.params },
    ])
  })

  test('returns an empty array for a wallet without names', async () => {
    const { calls, rpc } = createDomainsRpc(emptyProgramAccounts.result.result)
    await expect(getSkrDomains(rpc, EMPTY_WALLET)).resolves.toEqual([])
    expect(calls.map((call) => call.method)).toEqual(['getProgramAccounts'])
  })

  test('leaves out names that expired', async () => {
    const future = BigInt(Math.floor(Date.now() / 1000)) + 86_400n
    const { calls, rpc } = createDomainsRpc([programAccount(1, 1n), programAccount(2, future), programAccount(3)])
    await expect(getSkrDomains(rpc, BEEMAN_WALLET)).resolves.toHaveLength(2)
    expect(calls[1]?.params[0]).toHaveLength(2)
  })

  test('reads reverse accounts 100 per request, one after another', async () => {
    const { calls, rpc } = createDomainsRpc(Array.from({ length: 250 }, (_, index) => programAccount(index)))
    await getSkrDomains(rpc, BEEMAN_WALLET)
    expect(calls.slice(1).map((call) => (call.params[0] as unknown[]).length)).toEqual([100, 100, 50])
  })

  test('sorts the names and skips missing and empty reverse accounts', async () => {
    const labels = ['carol', null, 'alice', '', 'bob']
    const { rpc } = createDomainsRpc(
      labels.map((_, index) => programAccount(index)),
      (index) => (labels[index] === null ? null : reverseAccount(labels[index] ?? '')),
    )
    await expect(getSkrDomains(rpc, BEEMAN_WALLET)).resolves.toEqual(['alice.skr', 'bob.skr', 'carol.skr'])
  })

  test('throws a plain Error for an owner that is not an address', async () => {
    const { calls, rpc } = createDomainsRpc([])
    await expect(getSkrDomains(rpc, 'not an address' as Address)).rejects.toThrow(Error)
    expect(calls).toHaveLength(0)
  })
})
