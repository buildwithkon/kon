import { createPublicClient, erc20Abi, http, encodeFunctionData, toHex } from 'viem'
import { baseSepolia } from 'viem/chains'
import type { WalletSendCallsParams } from '@xmtp/content-type-wallet-send-calls'

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
})

const APP_COIN_FACTORY_ADDRESS = '0x...' // TODO: Set the actual factory address

const appCoinFactoryAbi = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' }
    ],
    name: 'createAppCoin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'appCoinAddress', type: 'address' },
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'symbol', type: 'string' }
    ],
    name: 'AppCoinCreated',
    type: 'event'
  }
] as const

export const createCoinCalls = (
  fromAddress: string,
  appName: string,
  name: string,
  symbol: string
): WalletSendCallsParams => {
  const createCoinData = encodeFunctionData({
    abi: appCoinFactoryAbi,
    functionName: 'createAppCoin',
    args: [name, symbol]
  })

  return {
    version: '1.0',
    from: fromAddress as `0x${string}`,
    chainId: toHex(baseSepolia.id),
    calls: [
      {
        to: APP_COIN_FACTORY_ADDRESS as `0x${string}`,
        data: createCoinData as `0x${string}`,
        metadata: {
          description: `💡 Creating new coin: "${name}" (${symbol})`,
          transactionType: 'call',
          networkId: baseSepolia.id
        }
      }
    ]
  }
}

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

export const getDeployedCoinAddress = async (
  ownerAddress: string,
  name: string,
  symbol: string
): Promise<string | null> => {
  try {
    const logs = await client.getContractEvents({
      address: APP_COIN_FACTORY_ADDRESS as `0x${string}`,
      abi: appCoinFactoryAbi,
      eventName: 'AppCoinCreated',
      args: {
        owner: ownerAddress as `0x${string}`
      },
      fromBlock: BigInt(await client.getBlockNumber() - 1000n),
      toBlock: 'latest'
    })

    // Filter logs by name and symbol since they're not indexed
    const matchingLog = logs.find(log =>
      log.args.name === name && log.args.symbol === symbol
    )

    if (matchingLog) {
      return matchingLog.args.appCoinAddress ?? null
    }
    return null
  } catch (error) {
    console.error('Error getting deployed coin address:', error)
    return null
  }
}
