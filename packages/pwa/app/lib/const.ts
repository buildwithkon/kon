import { baseSepolia, mainnet, sepolia } from 'viem/chains'

export const SITE_URL = 'https://kon.xyz'

export const ENS_APPCONFIG_CHAINID = sepolia.id
export const ENS_APPCONFIG_NAME = 'kon.eth'
export const ENS_APPCONFIG_KEY = 'app.kon'

export const COLOR_HEX_DARK = '#1e1e1e'
export const COLOR_HEX_LIGHT = '#f7f7f7'

export const BLOCKEXPLORER_URLS = [
  { [mainnet.id]: 'https://eth.blockscout.com' },
  { [sepolia.id]: 'https://eth-sepolia.blockscout.com' },
  { [baseSepolia.id]: 'https://base-sepolia.blockscout.com' }
]
