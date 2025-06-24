import type { ApiType } from '@konxyz/api/src'
import { hc } from 'hono/client'

interface ClientEnv {
  API_WORKER?: {
    fetch: (input: RequestInfo | URL, requestInit?: RequestInit) => Promise<Response>
  }
}

export const apiClient = (origin: string, env: ClientEnv, noCache = false) => {
  if (import.meta.env.DEV) {
    return hc<ApiType>('http://localhost:8787')
  }
  if (!env.API_WORKER) {
    throw new Error('API_WORKER binding not found')
  }
  return hc<ApiType>(origin, {
    fetch: env.API_WORKER.fetch.bind(env.API_WORKER),
    ...(noCache && { headers: { 'x-no-cache': 'true' } })
  })
}
