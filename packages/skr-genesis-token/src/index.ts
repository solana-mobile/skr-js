import { address, type Address } from '@solana/kit'

/** Mint, freeze, group, metadata and permanent-delegate authority of every Seeker Genesis Token. */
export const SGT_AUTHORITY: Address = address('GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4')

/** Group mint of the Seeker Genesis Token collection. Every SGT's metadata pointer targets it too. */
export const SGT_GROUP_ADDRESS: Address = address('GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te')

/** The Token-2022 program that owns every Seeker Genesis Token mint. */
export const TOKEN_2022_PROGRAM_ADDRESS: Address = address('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb')
