import { createRequestHandler } from 'react-router'

declare global {
  interface CloudflareEnvironment extends Env {}
}

declare module 'react-router' {
  export interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnvironment
      ctx: ExecutionContext
    }
  }
}

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE
)

export default {
  async fetch(request, env, ctx) {
    const envVars =
      import.meta.env.MODE === 'production'
        ? {
            ...env,
            // patch secrets_store_secrets
            ALCHEMY_API_KEY: await (env.ALCHEMY_API_KEY as unknown as { get(): Promise<string> }).get(),
            CDP_CLIENT_API_KEY: await (env.CDP_CLIENT_API_KEY as unknown as { get(): Promise<string> }).get()
          }
        : env
    return requestHandler(request, {
      cloudflare: { env: envVars, ctx }
    })
  }
} satisfies ExportedHandler<CloudflareEnvironment>
