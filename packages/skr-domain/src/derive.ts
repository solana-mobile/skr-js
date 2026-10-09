import { getAddressEncoder, getProgramDerivedAddress, type Address } from '@solana/kit'

import {
  ANS_PROGRAM_ADDRESS,
  ANS_ROOT,
  NAME_HOUSE_PROGRAM_ADDRESS,
  SKR_PARENT,
  SKR_TLD_HOUSE,
  TLD_HOUSE_PROGRAM_ADDRESS,
} from './constants.ts'
import { normalizeSkrName } from './normalize.ts'

/** Prefix the AllDomains name service hashes in front of every name. */
const HASH_PREFIX = 'ALT Name Service'
/** Seed of a name without a class: 32 zero bytes. */
const NO_CLASS = new Uint8Array(32)
/** Seed of a name without a parent: 32 zero bytes. */
const NO_PARENT = new Uint8Array(32)

const addressEncoder = getAddressEncoder()

/** SHA-256 of `'ALT Name Service' + name`, the first seed of every name account. */
export async function hashName(name: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(HASH_PREFIX + name))
  return new Uint8Array(digest)
}

/** Name account of `name` under `parent`, or without a parent when `parent` is `null`. */
export async function getNameAddress(name: string, parent: Address | null): Promise<Address> {
  const [nameAccount] = await getProgramDerivedAddress({
    programAddress: ANS_PROGRAM_ADDRESS,
    seeds: [await hashName(name), NO_CLASS, parent ? addressEncoder.encode(parent) : NO_PARENT],
  })
  return nameAccount
}

/** Root name account of the name service: the name `'ANS'` without a parent. */
export function getAnsRootAddress(): Promise<Address> {
  return getNameAddress('ANS', null)
}

/** Parent name account of every `.skr` name: the name `'.skr'` under the root. */
export function getSkrParentAddress(): Promise<Address> {
  return getNameAddress('.skr', ANS_ROOT)
}

/**
 * Derives the name account of a `.skr` name offline, without an RPC. Accepts `'alice'` and
 * `'Alice.skr'` alike, since the name goes through `normalizeSkrName` first, which throws a plain
 * `Error` for input that is not a single `.skr` label.
 */
export async function getSkrNameAddress(name: string): Promise<Address> {
  return getNameAddress(normalizeSkrName(name), SKR_PARENT)
}

/** Name House account of the `.skr` TLD, which owns the NFT records of wrapped `.skr` names. */
export async function getSkrNameHouseAddress(): Promise<Address> {
  const [nameHouse] = await getProgramDerivedAddress({
    programAddress: NAME_HOUSE_PROGRAM_ADDRESS,
    seeds: ['name_house', addressEncoder.encode(SKR_TLD_HOUSE)],
  })
  return nameHouse
}

/** NFT record of a `.skr` name account. A wrapped name has this account as its owner. */
export async function getSkrNftRecordAddress(nameAccount: Address): Promise<Address> {
  const [nftRecord] = await getProgramDerivedAddress({
    programAddress: NAME_HOUSE_PROGRAM_ADDRESS,
    seeds: ['nft_record', addressEncoder.encode(await getSkrNameHouseAddress()), addressEncoder.encode(nameAccount)],
  })
  return nftRecord
}

/** `MainDomain` account of `wallet`, which exists once the wallet picked a primary name. */
export async function getMainDomainAddress(wallet: Address): Promise<Address> {
  const [mainDomain] = await getProgramDerivedAddress({
    programAddress: TLD_HOUSE_PROGRAM_ADDRESS,
    seeds: ['main_domain', addressEncoder.encode(wallet)],
  })
  return mainDomain
}
