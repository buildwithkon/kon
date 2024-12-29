import type { ApiType } from '@konxyz/api/src'
import { FaviconPng, LogoPng } from '@konxyz/shared/assets'
import { devConfig } from '@konxyz/shared/data/devConfig'
import { APP_NAME, COLOR_HEX_MAIN_DEFAULT } from '@konxyz/shared/lib/const'
import type { AppConfig } from '@konxyz/shared/types'
import { hc } from 'hono/client'

export const client = (origin: string, env: Env) => {
  if (process.env.NODE_ENV === 'development') {
    return hc<ApiType>('http://localhost:8787')
  }
  return hc<ApiType>(origin, {
    fetch: env.API_WORKER.fetch.bind(env.API_WORKER)
  })
}

export const loadAppConfig = async (_url: string, env: Env) => {
  const url = new URL(_url)
  const urlArr = url.hostname.split('.')
  const subdomain = urlArr.length > 1 ? urlArr[0] : null

  if (process.env.NODE_ENV === 'development') {
    return {
      subdomain: devConfig.id,
      appConfig: devConfig
    }
  }
  // const subdomain = 'alpha'

  let appConfig = null
  if (subdomain) {
    try {
      const res = await client(url.origin, env).ens[':chain'].getAppConfig[':subdomain'].$get({
        param: {
          subdomain,
          chain: 'sepolia'
        }
      })
      const json = await res.json()
      appConfig = JSON.parse(json)
    } catch (error) {
      console.error('Error fetching appConfig:', error)
    }
  }

  return {
    subdomain,
    appConfig
  }
}

export const generateManifest = (appConfig: AppConfig) => ({
  short_name: appConfig?.name ?? APP_NAME,
  name: appConfig?.name ?? APP_NAME,
  start_url: '/',
  display: 'standalone',
  background_color: appConfig?.colors?.main ?? COLOR_HEX_MAIN_DEFAULT,
  theme_color: appConfig?.colors?.main ?? COLOR_HEX_MAIN_DEFAULT,
  icons: [
    {
      src: appConfig?.icons?.favicon ?? FaviconPng,
      sizes: '512x512',
      type: 'image/png'
    }
  ]
})

export const generateRootMeta = (appConfig: AppConfig) => [
  { title: appConfig?.name ?? 'A build with KON app' },
  { description: appConfig?.description ?? 'Build with KON' },
  { property: 'og:title', content: appConfig?.name ?? 'A build with KON app' },
  { property: 'og:description', content: appConfig?.description ?? 'Build with KON' },
  { property: 'og:site_name', content: appConfig?.name ?? 'A build with KON app' },
  { property: 'og:type', content: 'website' },
  { property: 'og:image', content: appConfig?.icons?.logo ?? LogoPng },
  { property: 'twitter:card', content: 'summary' },
  { property: 'twitter:title', content: appConfig?.name ?? 'A build with KON app' },
  { property: 'twitter:description', content: appConfig?.description ?? 'Build with KON' },
  { property: 'twitter:image', content: appConfig?.icons?.logo ?? LogoPng }
]

export const checkId = async (id: string, env: Env) => {
  try {
    const res = await client('', env).ens[':chain'].getSubnameAddress[':id'].$get({
      param: {
        id: `${id}.alpha.kon.eth`,
        chain: 'sepolia'
      }
    })
    const json = await res.json()
    console.log('-------:', JSON.parse(json))
    return {
      id: JSON.parse(json).id
    }
  } catch (error) {
    console.error('Error fetching subnameAddress:', error)
  }
}
