import { getAddressDecoder, getU16Decoder, getU64Decoder, type Address, type ReadonlyUint8Array } from '@solana/kit'

import { SGT_GROUP_ADDRESS } from './constants.ts'

/** Byte that holds the account type of a Token-2022 mint with extensions. */
const ACCOUNT_TYPE_OFFSET = 165
/** Account type of a mint. */
const ACCOUNT_TYPE_MINT = 1
/** Offset of the first TLV extension entry. */
const EXTENSIONS_OFFSET = 166
/** Each TLV entry starts with a `u16` type and a `u16` length. */
const EXTENSION_HEADER_LENGTH = 4
/** Extension type `MetadataPointer`: `authority: Address, metadataAddress: Address`. */
const EXTENSION_TYPE_METADATA_POINTER = 18
/** Extension type `TokenGroupMember`: `mint: Address, group: Address, memberNumber: u64`. */
const EXTENSION_TYPE_TOKEN_GROUP_MEMBER = 23
/** Extension type that marks the end of the TLV entries. */
const EXTENSION_TYPE_UNINITIALIZED = 0
const METADATA_POINTER_LENGTH = 64
const TOKEN_GROUP_MEMBER_LENGTH = 72

const addressDecoder = getAddressDecoder()
const u16Decoder = getU16Decoder()
const u64Decoder = getU64Decoder()

/** The fields of a Seeker Genesis Token mint that identify it as one. */
export type DecodedSeekerGenesisTokenMint = {
  /** Group the mint belongs to, read from its `TokenGroupMember` extension. Always `SGT_GROUP_ADDRESS`. */
  group: Address
  /** Position of the mint in the group, read from its `TokenGroupMember` extension. */
  memberNumber: bigint
  /** Target of the mint's `MetadataPointer` extension. Always `SGT_GROUP_ADDRESS`. */
  metadataAddress: Address
}

/**
 * Decodes the raw data of a Token-2022 mint and returns the fields that make it a Seeker Genesis Token,
 * or `null` when it is not one: data too short to hold extensions, not a mint, no `TokenGroupMember`
 * extension pointing at the SGT group, or no `MetadataPointer` extension pointing at the SGT group.
 *
 * Pure and offline: works on bytes from any source.
 */
export function decodeSeekerGenesisTokenMint(
  mintData: ReadonlyUint8Array | Uint8Array,
): DecodedSeekerGenesisTokenMint | null {
  if (!(mintData instanceof Uint8Array)) {
    throw new Error('mintData must be a Uint8Array')
  }
  if (mintData.length < EXTENSIONS_OFFSET || mintData[ACCOUNT_TYPE_OFFSET] !== ACCOUNT_TYPE_MINT) {
    return null
  }

  let group: Address | undefined
  let memberNumber: bigint | undefined
  let metadataAddress: Address | undefined
  let offset = EXTENSIONS_OFFSET
  while (offset + EXTENSION_HEADER_LENGTH <= mintData.length) {
    const extensionType = u16Decoder.decode(mintData, offset)
    const length = u16Decoder.decode(mintData, offset + 2)
    const start = offset + EXTENSION_HEADER_LENGTH
    const end = start + length
    if (extensionType === EXTENSION_TYPE_UNINITIALIZED || end > mintData.length) {
      break
    }
    if (extensionType === EXTENSION_TYPE_METADATA_POINTER && length === METADATA_POINTER_LENGTH) {
      metadataAddress = addressDecoder.decode(mintData, start + 32)
    } else if (extensionType === EXTENSION_TYPE_TOKEN_GROUP_MEMBER && length === TOKEN_GROUP_MEMBER_LENGTH) {
      group = addressDecoder.decode(mintData, start + 32)
      memberNumber = u64Decoder.decode(mintData, start + 64)
    }
    offset = end
  }

  if (group !== SGT_GROUP_ADDRESS || metadataAddress !== SGT_GROUP_ADDRESS || memberNumber === undefined) {
    return null
  }
  return { group, memberNumber, metadataAddress }
}

/**
 * Returns `true` when the raw data of a Token-2022 mint describes a Seeker Genesis Token.
 *
 * Pure and offline: works on bytes from any source.
 */
export function isSeekerGenesisTokenMint(mintData: ReadonlyUint8Array | Uint8Array): boolean {
  return decodeSeekerGenesisTokenMint(mintData) !== null
}
