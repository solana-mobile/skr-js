import { describe, expect, test } from 'bun:test'

import { assertIsAddress } from '@solana/kit'

import { SGT_GROUP_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS } from '../src/index.ts'

describe('constants', () => {
  test.each([
    ['SGT_GROUP_ADDRESS', SGT_GROUP_ADDRESS, 'GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te'],
    ['TOKEN_2022_PROGRAM_ADDRESS', TOKEN_2022_PROGRAM_ADDRESS, 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'],
  ])('%s is a valid address', (_name, actual, expected) => {
    assertIsAddress(actual)
    expect<string>(actual).toBe(expected)
  })
})
