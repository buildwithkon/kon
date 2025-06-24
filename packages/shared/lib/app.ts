import { devConfig } from '@konxyz/shared/data/devConfig'
import {
  APP_FALLBACK_DESCRIPTION,
  APP_FALLBACK_NAME,
  APP_NAME,
  COLOR_HEX_MAIN_DEFAULT,
  DEFAULT_FAVICON_URL,
  DEFAULT_LOGO_URL,
  getEnsAppConfigUser
} from '@konxyz/shared/lib/const'
import { apiClient } from '@konxyz/shared/lib/hono'
import type { AppConfig } from '@konxyz/shared/types'
import type { Env } from 'hono/types'

export const prepare = (_url: string) => {
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

  if (import.meta.env.DEV) {
    return {
      subdomain: devConfig.id,
      appConfig: devConfig
    }
  }

  let appConfig = null
  try {
    const res = await apiClient(origin, env).ens[':chain'].getAppConfig[':subdomain'].$get({
      param: {
        subdomain,
        chain: 'sepolia'
      }
    })
    appConfig = await (res as Response).json()
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
      src: appConfig?.icons?.logo ?? DEFAULT_FAVICON_URL,
      sizes: '512x512',
      type: 'image/png'
    }
  ]
})

export const generateRootMeta = (appConfig: AppConfig) => [
  { title: appConfig?.name ?? APP_FALLBACK_NAME },
  { description: appConfig?.description ?? APP_FALLBACK_DESCRIPTION },
  { property: 'og:title', content: appConfig?.name ?? APP_FALLBACK_NAME },
  { property: 'og:description', content: appConfig?.description ?? APP_FALLBACK_DESCRIPTION },
  { property: 'og:site_name', content: appConfig?.name ?? APP_FALLBACK_NAME },
  { property: 'og:type', content: 'website' },
  { property: 'og:image', content: appConfig?.icons?.logo ?? DEFAULT_LOGO_URL },
  { property: 'twitter:card', content: 'summary' },
  { property: 'twitter:title', content: appConfig?.name ?? APP_FALLBACK_NAME },
  { property: 'twitter:description', content: appConfig?.description ?? APP_FALLBACK_DESCRIPTION },
  { property: 'twitter:image', content: appConfig?.icons?.logo ?? DEFAULT_LOGO_URL }
]

export const checkId = async (id: string, url: string, env: Env) => {
  const { origin } = prepare(url)
  try {
    const res = await apiClient(origin, env).ens[':chain'].getSubnameAddress[':id'].$get({
      param: {
        id: `${id}.${getEnsAppConfigUser()}`,
        chain: 'sepolia'
      }
    })
    return await (res as Response).json()
  } catch (error) {
    console.error('Error fetching subnameAddress:', error)
  }
}

export const checkName = async (address: `0x${string}`, url: string, env: Env) => {
  const { origin } = prepare(url)
  try {
    const res = await apiClient(origin, env).ens[':chain'].getSubname[':address'].$get({
      param: {
        address,
        chain: 'sepolia'
      }
    })
    return await (res as Response).json()
  } catch (error) {
    console.error('Error fetching subname:', error)
  }
}
