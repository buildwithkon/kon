import type { WalletSendCallsParams } from '@xmtp/content-type-wallet-send-calls'
import { http, createPublicClient, encodeFunctionData, toHex } from 'viem'
import { sepolia } from 'viem/chains'
import { namehash, normalize } from 'viem/ens'
import { ENS_APPCONFIG_COIN_KEY, ENS_APPCONFIG_KEY, getEnsAppConfigBase } from '../../../shared/lib/const'
import { getCoinNameAndSymbol } from './coin'

const SEPOLIA_ENS_PUBLIC_RESOLVER = '0x8948458626811dd0c23eb25cc74291247077cc51'
const SEPOLIA_ENS_NAMEWRAPPER = '0x0635513f179d50a207757e05759cbd106d7dfce8'

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY!}`)
})

export const getAppInfo = async (appName: string) => {
  const target = `${appName}.${getEnsAppConfigBase()}`
  const res = await publicClient.getEnsText({
    name: normalize(target),
    key: ENS_APPCONFIG_KEY
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
    name: normalize(`${appName}.${getEnsAppConfigBase()}`)
  })
  return !!address
}

export const sendSetSubnodeRecordCalls = (fromAddress: string, appName: string): WalletSendCallsParams => {
  const parentNode = namehash(normalize(getEnsAppConfigBase()))
  const label = appName
  const owner = fromAddress as `0x${string}`
  const labelHash = `${appName}.${getEnsAppConfigBase()}`
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
          description: `💡 You are creating application: "${appName}.${getEnsAppConfigBase()}". (🔄 claim ENS: "${labelHash}")`,
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
  key: string,
  value: string
): WalletSendCallsParams => {
  const target = `${appName}.kon.eth`
  const node = namehash(normalize(target))
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
          description: `💡 You are updating application: "${appName}.${getEnsAppConfigBase()}". (🔄 setText "${key}" on ENS: "${target}")`,
          transactionType: 'call',
          networkId: sepolia.id
        }
      }
    ]
  }
}

export const getCoinInfo = async (appName: string) => {
  const target = `${appName}.${getEnsAppConfigBase()}`
  try {
    const res = await publicClient.getEnsText({
      name: normalize(target),
      key: ENS_APPCONFIG_COIN_KEY
    })
    if (!res) {
      return null
    }
    const [_, coinAddress] = res?.split(':') ?? []

    const coinInfo = await getCoinNameAndSymbol(coinAddress as `0x${string}`)

    return {
      address: coinAddress,
      ...coinInfo
    }
  } catch (error) {
    console.error('Error getting coin info:', error)
    return null
  }
}
