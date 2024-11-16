import type { WebAppManifest } from '@remix-pwa/dev'
import { type LoaderFunction, json } from '@remix-run/cloudflare'
import Favicon from '~/assets/favicon.png'
import { loadAppConfig } from '~/lib/utils'

export const loader: LoaderFunction = async ({ request }) => {
  const ld = await loadAppConfig(request.url)

  return (
    {
      short_name: ld?.appConfig?.name ?? 'kon',
      name: ld?.appConfig?.name ?? 'kon',
      start_url: '/',
      display: 'standalone',
      background_color: ld?.appConfig?.colors?.main ?? '#ffe614',
      theme_color: ld?.appConfig?.colors?.main ?? '#ffe614',
      icons: [
        {
          src: ld?.appConfig?.icon ?? Favicon,
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
