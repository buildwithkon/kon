import type { LoaderFunction } from '@remix-run/cloudflare'
import { getAppConfig } from '~/lib/ens'
import type { Env } from '~/types'

export const loader: LoaderFunction = async ({ params, context, request }) => {
  const data = params.subdomain ? await getAppConfig(context.cloudflare.env as Env, params.subdomain) : null
  const age = 3600

  return Response.json(data, {
    headers: {
      'Cache-Control': `public, max-age=${age}, s-maxage=${age}`
    }
  })
}
