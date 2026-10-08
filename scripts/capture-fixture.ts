/**
 * Capture a mainnet fixture for the tests.
 *
 *   bun scripts/capture-fixture.ts account <address>
 *   bun scripts/capture-fixture.ts rpc <method> '<params as JSON array>'
 *
 * Prints JSON to stdout: paste it into `packages/<name>/test/fixtures/`. The endpoint comes from
 * `SKR_RPC_URL` and defaults to the public mainnet endpoint.
 */

const endpoint = process.env.SKR_RPC_URL ?? 'https://api.mainnet-beta.solana.com'

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const response = await fetch(endpoint, {
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(`${method} failed with HTTP ${response.status}`)
  }
  return response.json()
}

async function main(): Promise<void> {
  const [mode, ...rest] = process.argv.slice(2)
  const capturedAt = new Date().toISOString().slice(0, 10)

  if (mode === 'account' && rest[0]) {
    const [address] = rest
    const result = await rpc('getAccountInfo', [address, { commitment: 'confirmed', encoding: 'base64' }])
    console.log(JSON.stringify({ address, capturedAt, endpoint, result }, null, 2))
    return
  }

  if (mode === 'rpc' && rest[0]) {
    const [method, params = '[]'] = rest
    const result = await rpc(method, JSON.parse(params))
    console.log(JSON.stringify({ capturedAt, endpoint, method, params: JSON.parse(params), result }, null, 2))
    return
  }

  console.error('usage: capture-fixture.ts account <address> | rpc <method> [params]')
  process.exit(1)
}

await main()
