import { http, createPublicClient } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

export const client = createPublicClient({
  chain: mainnet,
  transport: http()
})

export const clientSepolia = createPublicClient({
  chain: sepolia,
  transport: http()
})
