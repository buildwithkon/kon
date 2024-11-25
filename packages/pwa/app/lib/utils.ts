import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { devConfig } from '~/lib/data/devConfig'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const shortAddr = (address: string, prefix = 8, suffix = 4) => {
  if (!address) return ''
  return `${address.substring(1, prefix + 1)}...${address.substring(address.length - suffix)}`
}

export const loadAppConfig = async (_url: string) => {
  const urlArr = new URL(_url).hostname.split('.')
  const subdomain = urlArr.length > 1 ? urlArr[0] : null

  if (!subdomain) {
    return process.env.NODE_ENV === 'development'
      ? {
          subdomain: devConfig.id,
          appConfig: devConfig
        }
      : {
          subdomain: null,
          appConfig: null
        }
  }

  const apiUrl = `${new URL(_url).origin}/api/ens/getAppConfig/${subdomain}`
  let appConfig = null
  if (subdomain) {
    try {
      const response = await fetch(apiUrl)
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`)
      }
      appConfig = await response.json()
    } catch (error) {
      console.error('Error fetching appConfig:', error)
      appConfig = null
    }
  }

  return {
    subdomain,
    appConfig
  }
}
