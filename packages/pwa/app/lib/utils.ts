import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const shortAddr = (address: string, prefix = 8, suffix = 4) => {
  if (!address) return ''
  return `${address.substring(1, prefix + 1)}...${address.substring(address.length - suffix)}`
}

export const loadAppConfig = async (_url: string) => {
  // if (process.env.NODE_ENV === 'development') {
  //   return {
  //     subdomain: devConfig.id,
  //     appConfig: devConfig
  //   }
  // }

  const url = new URL(_url)
  const urlArr = url.hostname.split('.')
  const subdomain = urlArr.length > 1 ? urlArr[0] : null

  let appConfig = null
  if (subdomain) {
    console.log('1')
    try {
      console.log('2', `https://${url.hostname}/api/ens/getAppConfig/${subdomain}`)
      const response = await fetch(`https://${url.hostname}/api/ens/getAppConfig/${subdomain}`)
      console.log('3', response)
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`)
      }
      appConfig = await response.json()
      console.log('4', appConfig)
    } catch (error) {
      console.error('Error fetching appConfig:', error)
      appConfig = null
    }
  }

  console.log('-----config----', subdomain, appConfig)
  return {
    subdomain,
    appConfig
  }
}
