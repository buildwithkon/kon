import type { RootLoader } from '@konxyz/shared/types'
import { cookieStorage, createConfig, createStorage, http } from 'wagmi'
import { base, baseSepolia, mainnet, sepolia } from 'wagmi/chains'
import { baseAccount, injected, walletConnect } from 'wagmi/connectors'
import { APP_FALLBACK_NAME, DEFAULT_LOGO_URL } from '~/lib/const'

export const getWagmiConfig = (ld: RootLoader) =>
  createConfig({
    chains: [mainnet, sepolia, base, baseSepolia],
    connectors: [
      baseAccount({
        appName: ld?.appConfig?.name ?? APP_FALLBACK_NAME,
        appLogoUrl: ld?.appConfig?.icons?.logo ?? DEFAULT_LOGO_URL
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
      )
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
