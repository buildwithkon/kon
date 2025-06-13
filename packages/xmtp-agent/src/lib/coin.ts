import type { WalletSendCallsParams } from '@xmtp/content-type-wallet-send-calls'
import { http, createPublicClient, encodeFunctionData, erc20Abi, toHex } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({
  chain: baseSepolia,
  transport: http(`https://api.developer.coinbase.com/rpc/v1/base-sepolia/${process.env.CDP_CLIENT_API_KEY!}`)
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

const appCoinAbi = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'distributeCoin',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
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
      totalSupply: totalSupply?.result ? totalSupply.result.toLocaleString('en-US') : '0'
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
      fromBlock: BigInt((await client.getBlockNumber()) - 1000n),
      toBlock: 'latest'
    })

    // Filter logs by name and symbol since they're not indexed
    const matchingLog = logs.find((log) => log.args.name === name && log.args.symbol === symbol)

    if (matchingLog) {
      return matchingLog.args.appCoinAddress ?? null
    }
    return null
  } catch (error) {
    console.error('Error getting deployed coin address:', error)
    return null
  }
}

export const sendCoinCalls = (
  fromAddress: string,
  coinAddress: string,
  recipients: { address: string; amount: bigint }
): WalletSendCallsParams => {
  const distributeData = encodeFunctionData({
    abi: appCoinAbi,
    functionName: 'distributeCoin',
    args: [recipients.address as `0x${string}`, recipients.amount]
  })

  return {
    version: '1.0',
    from: fromAddress as `0x${string}`,
    chainId: toHex(baseSepolia.id),
    calls: [
      {
        to: coinAddress as `0x${string}`,
        data: distributeData as `0x${string}`,
        metadata: {
          description: `💡 Distributing coins to ${recipients.length} recipients`,
          transactionType: 'call',
          networkId: baseSepolia.id
        }
      }
    ]
  }
}
