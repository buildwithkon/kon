import type { WalletSendCallsParams } from '@xmtp/content-type-wallet-send-calls'
import { http, createPublicClient, encodeFunctionData, toHex, erc20Abi } from 'viem'
import { sepolia, baseSepolia } from 'viem/chains'
import { namehash, normalize } from 'viem/ens'
import { getCoinNameAndSymbol } from './coin'

const ENS_APP_KEY = 'app.kon'
const ENS_APP_COIN_KEY = 'coin.kon'
const APP_DOMAIN = 'kon.xyz'
const ENS_PARENT = 'kon.eth'

const SEPOLIA_ENS_PUBLIC_RESOLVER = '0x8948458626811dd0c23eb25cc74291247077cc51'
const SEPOLIA_ENS_NAMEWRAPPER = '0x0635513f179d50a207757e05759cbd106d7dfce8'

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
})

export const publicClientBase = createPublicClient({
  chain: baseSepolia,
  transport: http()
})

export const getAppInfo = async (appName: string) => {
  const target = `${appName}.${ENS_PARENT}`
  const res = await publicClient.getEnsText({
    name: normalize(target),
    key: ENS_APP_KEY
  })
  if (!res) {
    return null
  }
  const appInfo = JSON.parse(res)

  return {
    target,
    raw: appInfo,
    id: appInfo?.id || '',
    name: appInfo?.name || '',
    description: appInfo?.description || '',
    colors: JSON.stringify(appInfo?.colors, null, 2),
    template: JSON.stringify(appInfo?.template, null, 2)
  }
}

export const checkENS = async (appName: string): Promise<boolean> => {
  const address = await publicClient.getEnsAddress({
    name: normalize(`${appName}.${ENS_PARENT}`)
  })
  return !!address
}

export const sendSetSubnodeRecordCalls = (fromAddress: string, appName: string): WalletSendCallsParams => {
  const parentNode = namehash(normalize(ENS_PARENT))
  const label = appName
  const owner = fromAddress as `0x${string}`
  const labelHash = `${appName}.${ENS_PARENT}`
  const resolver = SEPOLIA_ENS_PUBLIC_RESOLVER
  const ttl = 0
  const fuses = 0
  const expiry = 0

  const abi = [
    {
      type: 'function',
      name: 'setSubnodeRecord',
      inputs: [
        { name: 'node', type: 'bytes32' },
        { name: 'label', type: 'string' },
        { name: 'owner', type: 'address' },
        { name: 'resolver', type: 'address' },
        { name: 'ttl', type: 'uint64' },
        { name: 'fuses', type: 'uint32' },
        { name: 'expiry', type: 'uint64' }
      ]
    }
  ]
  const transactionData = encodeFunctionData({
    abi,
    functionName: 'setSubnodeRecord',
    args: [parentNode, label, owner, resolver, ttl, fuses, expiry]
  })

  return {
    version: '1.0',
    from: fromAddress as `0x${string}`,
    chainId: toHex(sepolia.id),
    calls: [
      {
        to: SEPOLIA_ENS_NAMEWRAPPER,
        data: transactionData as `0x${string}`,
        metadata: {
          description: `💡 You are creating application: "${appName}.${APP_DOMAIN}". (🔄 claim ENS: "${labelHash}")`,
          transactionType: 'call',
          networkId: sepolia.id
        }
      }
    ]
  }
}

export const sendSetTextCalls = (
  fromAddress: string,
  appName: string,
  value: string
): WalletSendCallsParams => {
  const target = `${appName}.kon.eth`
  const node = namehash(normalize(target))
  const key = ENS_APP_KEY
  const abi = [
    {
      type: 'function',
      name: 'setText',
      inputs: [
        { name: 'node', type: 'bytes32' },
        { name: 'key', type: 'string' },
        { name: 'value', type: 'string' }
      ]
    }
  ]

  const transactionData = encodeFunctionData({
    abi,
    functionName: 'setText',
    args: [node, key, value]
  })

  return {
    version: '1.0',
    from: fromAddress as `0x${string}`,
    chainId: toHex(sepolia.id),
    calls: [
      {
        to: SEPOLIA_ENS_PUBLIC_RESOLVER,
        data: transactionData as `0x${string}`,
        metadata: {
          description: `💡 You are updating application: "${appName}.${APP_DOMAIN}". (🔄 setText "${ENS_APP_KEY}" on ENS: "${target}")`,
          transactionType: 'call',
          networkId: sepolia.id
        }
      }
    ]
  }
}

export const getCoinInfo = async (appName: string) => {
  const target = `${appName}.${ENS_PARENT}`
  try {
    const coinAddress = await publicClient.getEnsText({
      name: normalize(target),
      key: ENS_APP_COIN_KEY
    })
    if (!coinAddress) {
      return null
    }

    const coinInfo = await getCoinNameAndSymbol(coinAddress as `0x${string}`)

    return {
      address: coinAddress,
      ...coinInfo,
    }
  } catch (error) {
    console.error('Error getting coin info:', error)
    return null
  }
}
