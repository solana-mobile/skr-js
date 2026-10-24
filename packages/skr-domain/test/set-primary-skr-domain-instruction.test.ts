import { describe, expect, test } from 'bun:test'

import {
  AccountRole,
  address,
  generateKeyPairSigner,
  getBase58Decoder,
  type AccountSignerMeta,
  type Address,
} from '@solana/kit'

import {
  getSetPrimarySkrDomainInstruction,
  getUnsetPrimarySkrDomainInstruction,
  TLD_HOUSE_PROGRAM_ADDRESS,
} from '../src/index.ts'

const BEEMAN_WALLET = address('2c43Cag8oYcLKdSDKde9dj632LpejDAXB6DF32z9Ef7P')

/**
 * The `SetMainDomain` instruction of the mainnet transaction in which beeman.skr became the primary
 * name of its owner, captured 2026-10-24 from
 * 31UJCrRYRAm56Nc2FHcvW63v4yHqmzN9K4p1CTVwYc8KYyNMr1rv2D3wh8SWYuJFdL2bT8vxwuZ5qpsd5vyfcdgC.
 */
const BEEMAN_SET_MAIN_DOMAIN: { accounts: [string, AccountRole][]; data: string } = {
  accounts: [
    ['2c43Cag8oYcLKdSDKde9dj632LpejDAXB6DF32z9Ef7P', AccountRole.WRITABLE_SIGNER],
    ['VmmhRjr64KbpTZpgmeiVSWmR8H8RyqgigF1XQf8AvET', AccountRole.READONLY],
    ['4RKP4BEMu5sXBfXSH7xN2owtQrnAJvhhwtBBmj9JEYkA', AccountRole.READONLY],
    ['EFkEVbebRnZqrmhE4EtNubncEmS5VwtKfbWgegdZq91T', AccountRole.WRITABLE],
    ['11111111111111111111111111111111', AccountRole.READONLY],
    ['52ADjN72dV5q1ktf222M3dmpAwMAanX3CcTgEKfBJGiv', AccountRole.READONLY],
    ['F3A8kuikEiu6k2399oSJ1PWfcJYDHqpwoQ2e8psSDNuF', AccountRole.READONLY],
    ['J4ZDgKehcYYz95S4cFkm5wb5uU4PPg14Qo4aHDNvf6uM', AccountRole.WRITABLE],
    ['11111111111111111111111111111111', AccountRole.READONLY],
    ['ALTNSZ46uaAUU7XUV6awvdorLGqAsPwa9shm7h4uP2FK', AccountRole.READONLY],
  ],
  data: 'GgTVeZC66gHJEXWUQVuG7hKynVni9dNo5qzWmnSdZX3gLquYBNfUZGUa6DMedqfksaTsLMHc7n3LhBGxUxwUKzy2j93somFAgNuFMWHQ7vz9gzq9FqNnhXWFfsUNyGDzXG7o3X',
}

describe('getSetPrimarySkrDomainInstruction', () => {
  test.each(['beeman.skr', 'Beeman.skr', ' beeman '])('matches the instruction on mainnet for %p', async (name) => {
    const instruction = await getSetPrimarySkrDomainInstruction({ name, owner: BEEMAN_WALLET })

    expect(instruction.programAddress).toBe(TLD_HOUSE_PROGRAM_ADDRESS)
    expect(getBase58Decoder().decode(instruction.data!)).toBe(BEEMAN_SET_MAIN_DOMAIN.data)
    expect(instruction.accounts!.map((account): [string, AccountRole] => [account.address, account.role])).toEqual(
      BEEMAN_SET_MAIN_DOMAIN.accounts,
    )
  })

  test('attaches a TransactionSigner passed as the owner', async () => {
    const signer = await generateKeyPairSigner()

    const instruction = await getSetPrimarySkrDomainInstruction({ name: 'beeman.skr', owner: signer })

    const [owner] = instruction.accounts as AccountSignerMeta[]
    expect(owner).toEqual({ address: signer.address, role: AccountRole.WRITABLE_SIGNER, signer })
  })

  test('throws a plain Error for a name that is not a single .skr label', async () => {
    await expect(getSetPrimarySkrDomainInstruction({ name: 'pay.beeman.skr', owner: BEEMAN_WALLET })).rejects.toThrow(
      Error,
    )
  })

  test('throws a plain Error for an owner that is not an address', async () => {
    await expect(
      getSetPrimarySkrDomainInstruction({ name: 'beeman.skr', owner: 'not-an-address' as Address }),
    ).rejects.toThrow(Error)
  })
})

describe('getUnsetPrimarySkrDomainInstruction', () => {
  test('closes the MainDomain account of the owner', async () => {
    const instruction = await getUnsetPrimarySkrDomainInstruction({ owner: BEEMAN_WALLET })

    expect(instruction.programAddress).toBe(TLD_HOUSE_PROGRAM_ADDRESS)
    // Anchor discriminator of `close_main_domain`, which takes no arguments.
    expect(Array.from(instruction.data!)).toEqual([30, 91, 225, 42, 139, 118, 160, 134])
    expect(instruction.accounts!.map((account): [string, AccountRole] => [account.address, account.role])).toEqual([
      ['2c43Cag8oYcLKdSDKde9dj632LpejDAXB6DF32z9Ef7P', AccountRole.WRITABLE_SIGNER],
      ['2c43Cag8oYcLKdSDKde9dj632LpejDAXB6DF32z9Ef7P', AccountRole.READONLY],
      ['VmmhRjr64KbpTZpgmeiVSWmR8H8RyqgigF1XQf8AvET', AccountRole.READONLY],
      ['EFkEVbebRnZqrmhE4EtNubncEmS5VwtKfbWgegdZq91T', AccountRole.WRITABLE],
    ])
  })

  test('attaches a TransactionSigner passed as the owner', async () => {
    const signer = await generateKeyPairSigner()

    const instruction = await getUnsetPrimarySkrDomainInstruction({ owner: signer })

    const [owner] = instruction.accounts as AccountSignerMeta[]
    expect(owner).toEqual({ address: signer.address, role: AccountRole.WRITABLE_SIGNER, signer })
  })

  test('throws a plain Error for an owner that is not an address', async () => {
    await expect(getUnsetPrimarySkrDomainInstruction({ owner: 'not-an-address' as Address })).rejects.toThrow(Error)
  })
})
