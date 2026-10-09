import { createSolanaRpcFromTransport, type Rpc, type RpcTransport, type SolanaRpcApi } from '@solana/kit'

/** One JSON-RPC request the fake transport received. */
export type FakeRpcCall = {
  method: string
  params: readonly unknown[]
  signal: AbortSignal | undefined
}

/** Produces the `result` of a JSON-RPC response from the request's `params`. */
export type FakeRpcHandler = (params: readonly unknown[]) => unknown

export type FakeRpc = {
  calls: FakeRpcCall[]
  rpc: Rpc<SolanaRpcApi>
}

type JsonRpcPayload = { id: unknown; jsonrpc: '2.0'; method: string; params: readonly unknown[] }

function isJsonRpcPayload(value: unknown): value is JsonRpcPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'method' in value &&
    typeof value.method === 'string' &&
    'params' in value &&
    Array.isArray(value.params)
  )
}

/**
 * A kit `Rpc` whose transport answers each method from `handlers` with canned fixture data and logs
 * every request it receives, so tests can assert on the exact methods, params and signals used.
 */
export function createFakeRpc(handlers: Record<string, FakeRpcHandler>): FakeRpc {
  const calls: FakeRpcCall[] = []
  const transport: RpcTransport = async <TResponse>({
    payload,
    signal,
  }: {
    payload: unknown
    signal?: AbortSignal
  }): Promise<TResponse> => {
    if (!isJsonRpcPayload(payload)) {
      throw new Error('fake transport received a payload that is not a JSON-RPC request')
    }
    calls.push({ method: payload.method, params: payload.params, signal })
    if (signal?.aborted) {
      throw new Error(`${payload.method} was aborted`)
    }
    const handler = handlers[payload.method]
    if (!handler) {
      throw new Error(`fake transport has no handler for ${payload.method}`)
    }
    return { id: payload.id, jsonrpc: '2.0', result: handler(payload.params) } as TResponse
  }
  return { calls, rpc: createSolanaRpcFromTransport(transport) }
}
