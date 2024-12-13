import type { ApiType } from '@konxyz/api/src'
import { hc } from 'hono/client'
import Favicon from '~/assets/favicon.png'
import { APP_NAME, COLOR_HEX_MAIN_DEFAULT } from '~/lib/const'
import { devConfig } from '~/lib/data/devConfig'
import type { AppConfig } from '~/types'

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
      src: appConfig?.icons?.favicon ?? Favicon,
      sizes: '512x512',
      type: 'image/png'
    }
  ]
})
