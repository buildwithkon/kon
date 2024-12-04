import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import Favicon from '~/assets/favicon.png'
import { APP_NAME, COLOR_HEX_MAIN_DEFAULT } from '~/lib/const'
import { devConfig } from '~/lib/data/devConfig'
import type { AppConfig, Env } from '~/types'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const shortAddr = (address: string, prefix = 8, suffix = 4) => {
  if (!address) return ''
  return `${address.substring(1, prefix + 1)}...${address.substring(address.length - suffix)}`
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

  let appConfig = null
  if (subdomain) {
    try {
      const res = await env.API_WORKER.fetch(`${url.origin}/ens/sepolia/getAppConfig/${subdomain}`).then(
        (res) => res.json()
      )
      appConfig = JSON.parse(res)
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

export const genRanStr = (length = 5) => {
  // ref: https://www.w3schools.com/charsets/ref_utf_geometric.asp
  const CHARSET = [9720, 9721, 9722, 9647, 9671, 9727, 9663, 9657]
  return Array.from({ length }, () =>
    String.fromCharCode(CHARSET[Math.floor(Math.random() * CHARSET.length)])
  ).join('')
}
