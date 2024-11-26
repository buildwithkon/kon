import type { WebAppManifest } from '@remix-pwa/dev'
import type { LoaderFunction } from '@remix-run/cloudflare'
import Favicon from '~/assets/favicon.png'
import { loadAppConfig } from '~/lib/utils'

export const loader: LoaderFunction = async ({ request, context }) => {
  const ld = await loadAppConfig(request.url, context.cloudflare.env)

  return Response.json(
    {
      short_name: ld?.appConfig?.name ?? 'kon',
      name: ld?.appConfig?.name ?? 'kon',
      start_url: '/',
      display: 'standalone',
      background_color: ld?.appConfig?.colors?.main ?? '#ffe614',
      theme_color: ld?.appConfig?.colors?.main ?? '#ffe614',
      icons: [
        {
          src: ld?.appConfig?.icons?.favicon ?? Favicon,
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    } as WebAppManifest,
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Content-Type': 'application/manifest+json'
      }
    }
  )
}
