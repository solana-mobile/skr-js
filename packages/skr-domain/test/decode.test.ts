import { describe, expect, test } from 'bun:test'

import { address, getBase64Encoder } from '@solana/kit'

import { decodeMainDomain, decodeNameRecordHeader, SKR_PARENT } from '../src/index.ts'
import beemanMainDomain from './fixtures/beeman-main-domain.json'
import beemanNameAccount from './fixtures/beeman-name-account.json'

const BEEMAN_NAME_ACCOUNT = address('52ADjN72dV5q1ktf222M3dmpAwMAanX3CcTgEKfBJGiv')
const BEEMAN_WALLET = address('2c43Cag8oYcLKdSDKde9dj632LpejDAXB6DF32z9Ef7P')
const ZERO_ADDRESS = address('11111111111111111111111111111111')

function fixtureBytes(data: readonly string[]): Uint8Array {
  return new Uint8Array(getBase64Encoder().encode(data[0] ?? ''))
}

const mainDomainBytes = fixtureBytes(beemanMainDomain.result.result.value.data)
const nameRecordBytes = fixtureBytes(beemanNameAccount.result.result.value.data)

describe('decodeNameRecordHeader', () => {
  test('decodes the captured beeman.skr name account', () => {
    expect(nameRecordBytes).toHaveLength(200)
    expect(decodeNameRecordHeader(nameRecordBytes)).toEqual({
      class: ZERO_ADDRESS,
      createdAt: 1756293384n,
      expiresAt: 0n,
      nonTransferable: true,
      owner: BEEMAN_WALLET,
      parentName: SKR_PARENT,
    })
  })

  test.each([199, 120, 8, 0])('returns null for the first %i bytes', (length) => {
    expect(decodeNameRecordHeader(nameRecordBytes.slice(0, length))).toBeNull()
  })

  test('throws a plain Error for input that is not bytes', () => {
    expect(() => decodeNameRecordHeader('not bytes' as unknown as Uint8Array)).toThrow(Error)
  })
})

describe('decodeMainDomain', () => {
  test('decodes the captured MainDomain account of the beeman.skr owner', () => {
    expect(mainDomainBytes).toHaveLength(160)
    expect(decodeMainDomain(mainDomainBytes)).toEqual({
      domain: 'beeman',
      nameAccount: BEEMAN_NAME_ACCOUNT,
      tld: '.skr',
    })
  })

  test('returns null when the discriminator does not match', () => {
    const copy = new Uint8Array(mainDomainBytes)
    copy[0] = (copy[0] ?? 0) ^ 0xff
    expect(decodeMainDomain(copy)).toBeNull()
  })

  test.each([57, 48, 44, 40, 39, 8, 0])('returns null for the first %i bytes', (length) => {
    expect(decodeMainDomain(mainDomainBytes.slice(0, length))).toBeNull()
  })

  test('decodes the strings without the trailing padding', () => {
    const [tldLength, domainLength] = [4, 6]
    const end = 8 + 32 + 4 + tldLength + 4 + domainLength
    expect(decodeMainDomain(mainDomainBytes.slice(0, end))).toEqual({
      domain: 'beeman',
      nameAccount: BEEMAN_NAME_ACCOUNT,
      tld: '.skr',
    })
  })

  test('throws a plain Error for input that is not bytes', () => {
    expect(() => decodeMainDomain('not bytes' as unknown as Uint8Array)).toThrow(Error)
  })
})
