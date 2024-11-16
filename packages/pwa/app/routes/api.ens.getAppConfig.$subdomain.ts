import type { LoaderFunction } from '@remix-run/cloudflare'
import { getAppConfig } from '~/lib/ens'

export const loader: LoaderFunction = async ({ params }) => {
  const data = params.subdomain ? await getAppConfig(params.subdomain) : null
  // const age = 0

  return data ?? null

  // return json(data, {
  //   headers: {
  //     'Cache-Control': `public, max-age=${age}, s-maxage=${age}`
  //   }
  // })
}
