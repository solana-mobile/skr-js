import { describe, expect, test } from 'bun:test'

import { address, getAddressEncoder, getBase64Encoder } from '@solana/kit'

import { decodeSeekerGenesisTokenMint, isSeekerGenesisTokenMint, SGT_GROUP_ADDRESS } from '../src/index.ts'
import pyusdMint from './fixtures/pyusd-mint.json'
import sgtMint from './fixtures/sgt-mint.json'

/** `metadataAddress` of the `MetadataPointer` extension: TLV entry at 166, 4-byte header, 32-byte authority. */
const METADATA_ADDRESS_OFFSET = 166 + 4 + 32
/** `group` of the `TokenGroupMember` extension: TLV entry at 374, 4-byte header, 32-byte mint. */
const GROUP_OFFSET = 374 + 4 + 32

function fixtureBytes(data: readonly string[]): Uint8Array {
  return new Uint8Array(getBase64Encoder().encode(data[0] ?? ''))
}

const sgtBytes = fixtureBytes(sgtMint.result.result.value.data)
const pyusdBytes = fixtureBytes(pyusdMint.result.result.value.data)

/** Any address that is not the SGT group, written over a field to break the match. */
const OTHER_ADDRESS = address('DomgenqvpkvdfQyXVTXt1kdakFsM4X5wYj4qwMnsVMB4')

function withAddressAt(offset: number): Uint8Array {
  const copy = new Uint8Array(sgtBytes)
  copy.set(getAddressEncoder().encode(OTHER_ADDRESS), offset)
  return copy
}

describe('decodeSeekerGenesisTokenMint', () => {
  test('decodes the captured Seeker Genesis Token mint', () => {
    expect(sgtBytes).toHaveLength(450)
    expect(decodeSeekerGenesisTokenMint(sgtBytes)).toEqual({
      group: SGT_GROUP_ADDRESS,
      memberNumber: 20n,
      metadataAddress: SGT_GROUP_ADDRESS,
    })
  })

  test('returns null for PYUSD, a Token-2022 mint without a TokenGroupMember extension', () => {
    expect(decodeSeekerGenesisTokenMint(pyusdBytes)).toBeNull()
  })

  test.each([400, 200, 168])('returns null without throwing for the first %i bytes', (length) => {
    expect(decodeSeekerGenesisTokenMint(sgtBytes.slice(0, length))).toBeNull()
  })

  test('returns null for a legacy 82-byte mint', () => {
    expect(decodeSeekerGenesisTokenMint(sgtBytes.slice(0, 82))).toBeNull()
  })

  test('returns null when the account type is not a mint', () => {
    const copy = new Uint8Array(sgtBytes)
    copy[165] = 2
    expect(decodeSeekerGenesisTokenMint(copy)).toBeNull()
  })

  test('returns null when the TokenGroupMember group is another address', () => {
    expect(decodeSeekerGenesisTokenMint(withAddressAt(GROUP_OFFSET))).toBeNull()
  })

  test('returns null when the MetadataPointer targets another address', () => {
    expect(decodeSeekerGenesisTokenMint(withAddressAt(METADATA_ADDRESS_OFFSET))).toBeNull()
  })

  test('throws a plain Error for input that is not bytes', () => {
    expect(() => decodeSeekerGenesisTokenMint('not bytes' as unknown as Uint8Array)).toThrow(Error)
  })
})

describe('isSeekerGenesisTokenMint', () => {
  test('is true for the captured Seeker Genesis Token mint', () => {
    expect(isSeekerGenesisTokenMint(sgtBytes)).toBe(true)
  })

  test('is false for PYUSD', () => {
    expect(isSeekerGenesisTokenMint(pyusdBytes)).toBe(false)
  })

  test.each([400, 200, 168, 82])('is false for the first %i bytes', (length) => {
    expect(isSeekerGenesisTokenMint(sgtBytes.slice(0, length))).toBe(false)
  })
})
