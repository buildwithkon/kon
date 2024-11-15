import { http, createConfig } from 'wagmi'
import { baseSepolia, mainnet, sepolia } from 'wagmi/chains'
import { coinbaseWallet } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, baseSepolia],
  connectors: [coinbaseWallet({ appName: 'kon', preference: 'smartWalletOnly' })],
  transports: {
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/ziBNm4bakgfDB6QwLzcCL4O1BQOz8Iy7'),
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/ziBNm4bakgfDB6QwLzcCL4O1BQOz8Iy7'),
    [baseSepolia.id]: http(
      'https://api.developer.coinbase.com/rpc/v1/base-sepolia/V7OyyP7WW2etSoMza4gUBuurKrH6dR7w'
    )
  }
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
