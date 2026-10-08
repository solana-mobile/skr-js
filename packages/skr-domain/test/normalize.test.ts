import { describe, expect, test } from 'bun:test'

import { normalizeSkrName } from '../src/index.ts'

describe('normalizeSkrName', () => {
  test.each([
    ['Alice.skr', 'alice'],
    ['  beeman ', 'beeman'],
    ['beeman.skr', 'beeman'],
    ['beeman', 'beeman'],
    ['BEEMAN.SKR', 'beeman'],
  ])('%p becomes %p', (input, expected) => {
    expect(normalizeSkrName(input)).toBe(expected)
  })

  test.each(['', '.skr', '   ', 'a.b.skr', 'a.b', 'beeman.skr.skr', 'beeman.sol'])('throws for %p', (input) => {
    expect(() => normalizeSkrName(input)).toThrow(Error)
  })

  test('throws a plain Error for input that is not a string', () => {
    expect(() => normalizeSkrName(42 as unknown as string)).toThrow(Error)
  })
})
