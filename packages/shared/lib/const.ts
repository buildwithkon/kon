import { baseSepolia, mainnet, sepolia } from 'viem/chains'

export const APP_NAME = 'KON'
export const SITE_URL = 'https://kon.xyz'

export const ENS_APPCONFIG_CHAINID = sepolia.id
export const ENS_APPCONFIG_BASE = 'kon.eth'
export const ENS_APPCONFIG_USER = 'u.kon.eth'
export const ENS_APPCONFIG_KEY = 'app.kon'

export const COLOR_HEX_DARK = '#1e1e1e'
export const COLOR_HEX_LIGHT = '#f7f7f7'
export const COLOR_HEX_MAIN_DEFAULT = '#ffe614'

export const DEFAULT_FAVICON_URL = 'https://kon.xyz/static/favicon.png'
export const DEFAULT_LOGO_URL = 'https://kon.xyz/static/logo.png'

export const REGISTER_ADDRESS = '0x39ab724cd0d37e66a3fe0bdf629d3a1a7013aee3'

export const BLOCKEXPLORER_URLS = [
  { [mainnet.id]: 'https://eth.blockscout.com' },
  { [sepolia.id]: 'https://eth-sepolia.blockscout.com' },
  { [baseSepolia.id]: 'https://base-sepolia.blockscout.com' }
]

export const ADDRESSES = {
  ENS_L2_REGISTRY: '0xde364581c00a929edbf80cabbd6aaafb7f2edf62',
  ENS_L2_REGISTRAR: '0xde364581c00a929edbf80cabbd6aaafb7f2edf62'
}
