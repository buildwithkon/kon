import type { RootLoader } from '@konxyz/shared/types'
// import { Porto } from 'porto'
import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { base, baseSepolia, mainnet, odysseyTestnet, sepolia } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'
import { APP_FALLBACK_NAME, DEFAULT_LOGO_URL } from './const'

// Porto.create()

export const getWagmiConfig = (ld: RootLoader) =>
  createConfig({
    chains: [mainnet, sepolia, base, baseSepolia, odysseyTestnet],
    connectors: [
      coinbaseWallet({
        appName: ld?.appConfig?.name ?? APP_FALLBACK_NAME,
        appLogoUrl: ld?.appConfig?.icons?.logo ?? DEFAULT_LOGO_URL,
        preference: {
          options: 'smartWalletOnly'
        }
      }),
      injected(),
      walletConnect({ projectId: ld?.ENV?.WC_PROJECT_ID })
    ],
    transports: {
      [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${ld?.ENV?.ALCHEMY_API_KEY}`),
      [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${ld?.ENV?.ALCHEMY_API_KEY}`),
      [base.id]: http(`https://api.developer.coinbase.com/rpc/v1/base/${ld?.ENV?.CDP_CLIENT_API_KEY}`),
      [baseSepolia.id]: http(
        `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${ld?.ENV?.CDP_CLIENT_API_KEY}`
      ),
      [odysseyTestnet.id]: http()
    },
    ssr: true,
    storage: createStorage({
      storage: cookieStorage
    })
  })

declare module 'wagmi' {
  interface Register {
    config: typeof getWagmiConfig
  }
}
