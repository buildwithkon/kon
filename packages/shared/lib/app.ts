import type { ApiType } from '@konxyz/api/src'
import { FaviconPng, LogoPng } from '@konxyz/shared/assets'
import { devConfig } from '@konxyz/shared/data/devConfig'
import { APP_NAME, COLOR_HEX_MAIN_DEFAULT, ENS_APPCONFIG_USER } from '@konxyz/shared/lib/const'
import type { AppConfig } from '@konxyz/shared/types'
import { hc } from 'hono/client'

export const client = (origin: string, env: Env, noCache = false) => {
  if (process.env.NODE_ENV === 'development') {
    return hc<ApiType>('http://localhost:8787')
  }
  return hc<ApiType>(origin, {
    fetch: env.API_WORKER.fetch.bind(env.API_WORKER),
    ...(noCache && { headers: { 'x-no-cache': 'true' } })
  })
}
const prepare = (_url: string) => {
  const url = new URL(_url)
  const urlArr = url.hostname.split('.')
  const subdomain = urlArr.length > 1 ? urlArr[0] : null

  return {
    subdomain: process.env.NODE_ENV === 'development' ? devConfig.id : subdomain,
    origin: url.origin
  }
}

export const loadAppConfig = async (_url: string, env: Env) => {
  const { subdomain, origin } = prepare(_url)

  if (process.env.NODE_ENV === 'development') {
    return {
      subdomain: devConfig.id,
      appConfig: devConfig
    }
  }

  let appConfig = null
  try {
    const res = await client(origin, env).ens[':chain'].getAppConfig[':subdomain'].$get({
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

export const checkId = async (id: string, url: string, env: Env) => {
  const { origin } = prepare(url)
  try {
    const res = await client(origin, env, true).ens[':chain'].getSubnameAddress[':id'].$get({
      param: {
        id: `${id}.${ENS_APPCONFIG_USER}`,
        chain: 'sepolia'
      }
    })
    return await res.json()
  } catch (error) {
    console.error('Error fetching subnameAddress:', error)
  }
}
