import { describe, expect, test } from 'bun:test'

import { assertIsAddress } from '@solana/kit'

import {
  ANS_PROGRAM_ADDRESS,
  ANS_ROOT,
  NAME_HOUSE_PROGRAM_ADDRESS,
  SKR_PARENT,
  SKR_TLD_HOUSE,
  TLD_HOUSE_PROGRAM_ADDRESS,
} from '../src/index.ts'

describe('constants', () => {
  test.each([
    ['ANS_PROGRAM_ADDRESS', ANS_PROGRAM_ADDRESS, 'ALTNSZ46uaAUU7XUV6awvdorLGqAsPwa9shm7h4uP2FK'],
    ['ANS_ROOT', ANS_ROOT, '3mX9b4AZaQehNoQGfckVcmgmA6bkBoFcbLj9RMmMyNcU'],
    ['NAME_HOUSE_PROGRAM_ADDRESS', NAME_HOUSE_PROGRAM_ADDRESS, 'NH3uX6FtVE2fNREAioP7hm5RaozotZxeL6khU1EHx51'],
    ['SKR_PARENT', SKR_PARENT, 'F3A8kuikEiu6k2399oSJ1PWfcJYDHqpwoQ2e8psSDNuF'],
    ['SKR_TLD_HOUSE', SKR_TLD_HOUSE, '4RKP4BEMu5sXBfXSH7xN2owtQrnAJvhhwtBBmj9JEYkA'],
    ['TLD_HOUSE_PROGRAM_ADDRESS', TLD_HOUSE_PROGRAM_ADDRESS, 'TLDHkysf5pCnKsVA4gXpNvmy7psXLPEu4LAdDJthT9S'],
  ])('%s is a valid address', (_name, actual, expected) => {
    assertIsAddress(actual)
    expect<string>(actual).toBe(expected)
  })
})
