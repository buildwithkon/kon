import type { AppConfig } from '@konxyz/shared/types'
import { Porto } from 'porto'
import { http, cookieStorage, createConfig, createStorage } from 'wagmi'
import { base, baseSepolia, mainnet, odysseyTestnet, sepolia } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'
import { APP_NAME } from './const'

Porto.create()

export const getWagmiConfig = (ENV: Env, appConfig?: AppConfig) =>
  createConfig({
    ssr: true,
    chains: [mainnet, sepolia, base, baseSepolia, odysseyTestnet],
    connectors: [
      coinbaseWallet({
        appName: APP_NAME,
        appLogoUrl: appConfig?.icons?.logo ?? 'https://kon.xyz/static/logo.png',
        preference: {
          options: 'smartWalletOnly'
        },
        version: '4'
      })
    ],
    transports: {
      [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${ENV.ALCHEMY_API_KEY}`),
      [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${ENV.ALCHEMY_API_KEY}`),
      [base.id]: http(`https://api.developer.coinbase.com/rpc/v1/base/${ENV.CDP_CLIENT_API_KEY}`),
      [baseSepolia.id]: http(
        `https://api.developer.coinbase.com/rpc/v1/base-sepolia/${ENV.CDP_CLIENT_API_KEY}`
      ),
      [odysseyTestnet.id]: http()
    },
    storage: createStorage({
      storage: cookieStorage
    })
  })

declare module 'wagmi' {
  interface Register {
    config: typeof getWagmiConfig
  }
}
