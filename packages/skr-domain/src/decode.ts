import { getAddressDecoder, getU32Decoder, getU64Decoder, getUtf8Decoder, type ReadonlyUint8Array } from '@solana/kit'

import type { MainDomain, NameRecordHeader } from './types.ts'

/** Anchor discriminator of a `MainDomain` account of the TLD House program. */
const MAIN_DOMAIN_DISCRIMINATOR: readonly number[] = [109, 239, 227, 199, 98, 226, 66, 175]
/** Offset of `nameAccount`, right after the 8-byte discriminator. */
const MAIN_DOMAIN_NAME_ACCOUNT_OFFSET = 8
/** Offset of the `u32` length prefix of `tld`. `domain` follows it with its own prefix. */
const MAIN_DOMAIN_TLD_OFFSET = 40

/** Offset of `class`. */
const NAME_RECORD_CLASS_OFFSET = 72
/** Offset of `createdAt`, a `u64` of seconds. */
const NAME_RECORD_CREATED_AT_OFFSET = 112
/** Offset of `expiresAt`, a `u64` of seconds. `0` means never. */
const NAME_RECORD_EXPIRES_AT_OFFSET = 104
/** Size of the fixed header, padding included. */
const NAME_RECORD_HEADER_LENGTH = 200
/** Offset of `nonTransferable`, a `u8` flag. */
const NAME_RECORD_NON_TRANSFERABLE_OFFSET = 120
/** Offset of `owner`. */
const NAME_RECORD_OWNER_OFFSET = 40
/** Offset of `parentName`, right after the 8-byte discriminator. */
const NAME_RECORD_PARENT_NAME_OFFSET = 8

const addressDecoder = getAddressDecoder()
const u32Decoder = getU32Decoder()
const u64Decoder = getU64Decoder()
const utf8Decoder = getUtf8Decoder()

function assertBytes(data: ReadonlyUint8Array | Uint8Array): void {
  if (!(data instanceof Uint8Array)) {
    throw new Error('data must be a Uint8Array')
  }
}

/**
 * Reads a `u32`-length-prefixed utf8 string at `offset`. Returns the string and the offset right
 * after it, or `null` when the bytes end before the string does.
 */
function decodeString(data: ReadonlyUint8Array, offset: number): [string, number] | null {
  if (offset + 4 > data.length) {
    return null
  }
  const length = u32Decoder.decode(data, offset)
  const start = offset + 4
  const end = start + length
  if (end > data.length) {
    return null
  }
  return [utf8Decoder.decode(data.slice(start, end)), end]
}

/**
 * Decodes the raw data of a `MainDomain` account of the TLD House program, or returns `null` when
 * the discriminator does not match or the data ends before the strings do.
 *
 * Pure and offline: works on bytes from any source.
 */
export function decodeMainDomain(data: ReadonlyUint8Array | Uint8Array): MainDomain | null {
  assertBytes(data)
  if (data.length < MAIN_DOMAIN_TLD_OFFSET) {
    return null
  }
  if (MAIN_DOMAIN_DISCRIMINATOR.some((byte, index) => data[index] !== byte)) {
    return null
  }
  const nameAccount = addressDecoder.decode(data, MAIN_DOMAIN_NAME_ACCOUNT_OFFSET)
  const tld = decodeString(data, MAIN_DOMAIN_TLD_OFFSET)
  if (!tld) {
    return null
  }
  const domain = decodeString(data, tld[1])
  if (!domain) {
    return null
  }
  return { domain: domain[0], nameAccount, tld: tld[0] }
}

/**
 * Decodes the fixed 200-byte header of an AllDomains name account, or returns `null` when the data
 * is shorter than that. `expiresAt` stays `0n` for a name that never expires.
 *
 * Pure and offline: works on bytes from any source.
 */
export function decodeNameRecordHeader(data: ReadonlyUint8Array | Uint8Array): NameRecordHeader | null {
  assertBytes(data)
  if (data.length < NAME_RECORD_HEADER_LENGTH) {
    return null
  }
  return {
    class: addressDecoder.decode(data, NAME_RECORD_CLASS_OFFSET),
    createdAt: u64Decoder.decode(data, NAME_RECORD_CREATED_AT_OFFSET),
    expiresAt: u64Decoder.decode(data, NAME_RECORD_EXPIRES_AT_OFFSET),
    nonTransferable: data[NAME_RECORD_NON_TRANSFERABLE_OFFSET] !== 0,
    owner: addressDecoder.decode(data, NAME_RECORD_OWNER_OFFSET),
    parentName: addressDecoder.decode(data, NAME_RECORD_PARENT_NAME_OFFSET),
  }
}
