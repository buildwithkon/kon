import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import Favicon from '~/assets/favicon.png'
import { devConfig } from '~/lib/data/devConfig'
import type { Env, LoaderData } from '~/types'

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
      const res = await env.API_ENS.fetch(`${url.origin}/api/ens/sepolia/getAppConfig/${subdomain}`).then(
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

export const generateManifest = (ld: LoaderData) => ({
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
})
