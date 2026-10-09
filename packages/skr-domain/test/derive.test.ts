import { describe, expect, test } from 'bun:test'

import { address } from '@solana/kit'

import {
  getAnsRootAddress,
  getMainDomainAddress,
  getSkrNameHouseAddress,
  getSkrNftRecordAddress,
  getSkrParentAddress,
} from '../src/derive.ts'
import { ANS_ROOT, getSkrNameAddress, SKR_PARENT } from '../src/index.ts'

const BEEMAN_MAIN_DOMAIN = address('EFkEVbebRnZqrmhE4EtNubncEmS5VwtKfbWgegdZq91T')
const BEEMAN_NAME_ACCOUNT = address('52ADjN72dV5q1ktf222M3dmpAwMAanX3CcTgEKfBJGiv')
const BEEMAN_NFT_RECORD = address('4Y7E6kSFzR7zg8ytVHfYWRtczrUD7cMRVkTwUV2Y6Fm3')
const BEEMAN_WALLET = address('2c43Cag8oYcLKdSDKde9dj632LpejDAXB6DF32z9Ef7P')
const SKR_NAME_HOUSE = address('CPD3hKJE51VuiDE5u5Nosx1u7MXWwKGPff8HFJTtpX4V')

describe('getSkrNameAddress', () => {
  test.each(['beeman', 'Beeman.skr', ' BEEMAN '])('derives the beeman.skr name account from %p', async (name) => {
    await expect(getSkrNameAddress(name)).resolves.toBe(BEEMAN_NAME_ACCOUNT)
  })

  test('throws a plain Error for a name that is not a single .skr label', async () => {
    await expect(getSkrNameAddress('a.b.skr')).rejects.toThrow(Error)
  })
})

describe('constants derive from their seeds', () => {
  test('ANS_ROOT is the name "ANS" without a parent', async () => {
    await expect(getAnsRootAddress()).resolves.toBe(ANS_ROOT)
  })

  test('SKR_PARENT is the name ".skr" under the root', async () => {
    await expect(getSkrParentAddress()).resolves.toBe(SKR_PARENT)
  })
})

describe('Name House derivations', () => {
  test('the .skr name house is a PDA of the TLD House program', async () => {
    await expect(getSkrNameHouseAddress()).resolves.toBe(SKR_NAME_HOUSE)
  })

  test('the NFT record of beeman.skr is a PDA of the Name House program', async () => {
    await expect(getSkrNftRecordAddress(BEEMAN_NAME_ACCOUNT)).resolves.toBe(BEEMAN_NFT_RECORD)
  })
})

describe('getMainDomainAddress', () => {
  test('derives the MainDomain account of a wallet', async () => {
    await expect(getMainDomainAddress(BEEMAN_WALLET)).resolves.toBe(BEEMAN_MAIN_DOMAIN)
  })
})
