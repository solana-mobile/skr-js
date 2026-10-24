import { describe, expect, test } from 'bun:test'

import {
  appendTransactionMessageInstruction,
  address,
  compileTransaction,
  createSolanaRpc,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  type Address,
  type Instruction,
} from '@solana/kit'

import {
  getPrimarySkrDomain,
  getSetPrimarySkrDomainInstruction,
  getSkrDomains,
  getUnsetPrimarySkrDomainInstruction,
  resolveSkrDomain,
} from '../src/index.ts'

const BEEMAN_NAME_ACCOUNT = address('52ADjN72dV5q1ktf222M3dmpAwMAanX3CcTgEKfBJGiv')
const BEEMAN_WALLET = address('2c43Cag8oYcLKdSDKde9dj632LpejDAXB6DF32z9Ef7P')
/** A fresh wallet that has never picked a primary name. */
const EMPTY_WALLET = address('9ro9p11F5Wr6aVCem1PkJn6V78AM98zGE25bqgGpVahQ')
/** A funded wallet that owns devrel.skr, not beeman.skr, so a simulation reaches the ownership check. */
const FUNDED_NON_OWNER = address('ALiCE7RQC53Xs7mQy2K8rrfSqVMWwYQocqzoXZG1sNx1')
/** TLD House `PublicKeyMismatch`, thrown when the signer does not own the name. Kit decodes the numbers as bigints. */
const PUBLIC_KEY_MISMATCH: unknown = { InstructionError: [0n, { Custom: 6000n }] }

describe.skipIf(!process.env.SKR_LIVE_TESTS)('mainnet', () => {
  const rpc = createSolanaRpc(process.env.SKR_RPC_URL ?? 'https://api.mainnet-beta.solana.com')

  test('resolveSkrDomain resolves beeman.skr to its owner', async () => {
    await expect(resolveSkrDomain(rpc, 'beeman.skr')).resolves.toEqual({
      expiresAt: null,
      nameAccount: BEEMAN_NAME_ACCOUNT,
      owner: BEEMAN_WALLET,
    })
  })

  test('resolveSkrDomain is null for a name nobody registered', async () => {
    await expect(resolveSkrDomain(rpc, 'no-such-name-9ro9p11f5wr6avcem1pkjn6v78am98zge25bqggpvahq')).resolves.toBeNull()
  })

  test('getPrimarySkrDomain is beeman.skr for its owner', async () => {
    await expect(getPrimarySkrDomain(rpc, BEEMAN_WALLET)).resolves.toBe('beeman.skr')
  })

  test('getPrimarySkrDomain is null for a wallet without a primary name', async () => {
    await expect(getPrimarySkrDomain(rpc, EMPTY_WALLET)).resolves.toBeNull()
  })

  test('getSkrDomains includes beeman.skr for its owner', async () => {
    expect(await getSkrDomains(rpc, BEEMAN_WALLET)).toContain('beeman.skr')
  })

  /** Simulates `instruction` with `owner` as fee payer, without signatures, and returns the error. */
  async function simulate(owner: Address, instruction: Instruction) {
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send()
    const transaction = pipe(
      createTransactionMessage({ version: 0 }),
      (message) => setTransactionMessageFeePayer(owner, message),
      (message) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
      (message) => appendTransactionMessageInstruction(instruction, message),
      compileTransaction,
    )
    const { value } = await rpc
      .simulateTransaction(getBase64EncodedWireTransaction(transaction), {
        encoding: 'base64',
        replaceRecentBlockhash: true,
        sigVerify: false,
      })
      .send()
    return value.err
  }

  test('getSetPrimarySkrDomainInstruction simulates for the owner of the name', async () => {
    expect(
      await simulate(
        BEEMAN_WALLET,
        await getSetPrimarySkrDomainInstruction({ name: 'beeman.skr', owner: BEEMAN_WALLET }),
      ),
    ).toBeNull()
  })

  test('getSetPrimarySkrDomainInstruction fails to simulate for a wallet that does not own the name', async () => {
    const error: unknown = await simulate(
      FUNDED_NON_OWNER,
      await getSetPrimarySkrDomainInstruction({ name: 'beeman.skr', owner: FUNDED_NON_OWNER }),
    )
    expect(error).toEqual(PUBLIC_KEY_MISMATCH)
  })

  test('getUnsetPrimarySkrDomainInstruction simulates for a wallet with a primary name', async () => {
    expect(
      await simulate(BEEMAN_WALLET, await getUnsetPrimarySkrDomainInstruction({ owner: BEEMAN_WALLET })),
    ).toBeNull()
  })
})
