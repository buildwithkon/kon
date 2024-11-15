import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const shortAddr = (address: string, prefix = 8, suffix = 4) => {
  if (!address) return ''
  return `${address.substring(1, prefix + 1)}...${address.substring(address.length - suffix)}`
}

export const loadAppConfig = async (_url: string) => {
  if (process.env.NODE_ENV === 'development') {
    return {
      subdomain: devConfig.id,
      appConfig: devConfig
    }
  }

  const url = new URL(_url)
  const urlArr = url.hostname.split('.')
  const subdomain = urlArr.length > 1 ? urlArr[0] : null
  const appConfig = subdomain
    ? await fetch(`${url.origin}/api/ens/getAppConfig/${subdomain}`).then((res) => res.json())
    : null

  return {
    subdomain,
    appConfig
  }
}