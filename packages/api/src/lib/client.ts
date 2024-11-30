import { http, createPublicClient } from 'viem'
import { mainnet, sepolia } from 'viem/chains'

const client = (ALCHEMY_API_KEY: string) =>
  createPublicClient({
    chain: mainnet,
    transport: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
  })

const clientSepolia = (ALCHEMY_API_KEY: string) =>
  createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`)
  })

export const getClient = (chain: 'mainnet' | 'sepolia', ALCHEMY_API_KEY: string) =>
  chain === 'sepolia' ? clientSepolia(ALCHEMY_API_KEY) : client(ALCHEMY_API_KEY)
