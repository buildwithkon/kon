import { createPublicClient, erc20Abi, http } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
})

export const getCoinNameAndSymbol = async (coinAddress: `0x${string}`) => {
  try {
    const [symbol, name, totalSupply] = await client.multicall({
      contracts: [
        {
          address: coinAddress,
          abi: erc20Abi,
          functionName: 'symbol'
        },
        {
          address: coinAddress,
          abi: erc20Abi,
          functionName: 'name'
        },
        {
          address: coinAddress,
          abi: erc20Abi,
          functionName: 'totalSupply'
        }
      ]
    })

    console.log(totalSupply.result)

    return {
      name: name?.result ?? '',
      symbol: symbol?.result ?? '',
      totalSupply: totalSupply?.result ? totalSupply.result.toLocaleString('en-US'): '0',
    }
  } catch (error) {
  console.error('Error getting coin info:', error)
  return null
  }
}
