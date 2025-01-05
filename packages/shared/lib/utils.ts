import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const shortAddr = (address: string, prefix = 8, suffix = 4) => {
  if (!address) return ''
  return `${address.substring(0, prefix + 1)}...${address.substring(address.length - suffix)}`
}

export const genRanStr = (length = 5) => {
  // ref: https://www.w3schools.com/charsets/ref_utf_geometric.asp
  const CHARSET = [9720, 9721, 9722, 9647, 9671, 9727, 9663, 9657]
  return Array.from({ length }, () =>
    String.fromCharCode(CHARSET[Math.floor(Math.random() * CHARSET.length)])
  ).join('')
}
