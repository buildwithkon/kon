import { sepolia, mainnet } from 'viem/chains'

export const APP_NAME = 'KON'
export const SITE_URL = 'https://kon.xyz'

export const APP_FALLBACK_NAME = 'A build with KON app'
export const APP_FALLBACK_DESCRIPTION = 'Build with KON'

// export const ENS_APPCONFIG_CHAINID = sepolia.id
export const ENS_APPCONFIG_KEY = 'kon.app'
export const ENS_APPCONFIG_COIN_KEY = 'kon.coin'
export const ENS_APPCONFIG_REWORDS_KEY = 'kon.rewords'
// export const ENS_APPCONFIG_BASE = 'kon.eth'
// export const ENS_APPCONFIG_USER = 'user.kon.eth'
export const getEnsAppconfigChainId = (isProd = false) => (isProd ? sepolia.id : mainnet.id)
export const getEnsAppConfigBase = (isProd = false) => (isProd ? 'kon.xyz' : 'kon.wtf')
export const getEnsAppConfigUser = (isProd = false) => (isProd ? 'u.kon.xyz' : 'u.kon.wtf')

export const COLOR_HEX_DARK = '#1e1e1e'
export const COLOR_HEX_LIGHT = '#f7f7f7'
export const COLOR_HEX_MAIN_DEFAULT = '#ffe614'

export const DEFAULT_FAVICON_URL = 'https://kon.xyz/static/favicon.png'
export const DEFAULT_LOGO_URL = 'https://kon.xyz/static/logo.png'

export const REGISTER_ADDRESS = '0x39ab724cd0d37e66a3fe0bdf629d3a1a7013aee3'

export const ADDRESSES = {
  ENS_L1_RESOLBER: '0x00f9314C69c3e7C37b3C7aD36EF9FB40d94eDDe1',
  ENS_L2_REGISTRY: '0xde364581c00a929edbf80cabbd6aaafb7f2edf62',
  ENS_L2_REGISTRAR: '0x3e201738085730ff2f6cd42d712603643cc05902'
}
