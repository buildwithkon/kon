import type { WalletSendCallsParams } from '@xmtp/content-type-wallet-send-calls'
import { http, createPublicClient, encodeFunctionData, toHex } from 'viem'
import { sepolia } from 'viem/chains'
import { namehash, normalize } from 'viem/ens'

const ENS_APP_KEY = 'app.kon'
const ENS_APP_BASE = 'kon.xyz'

const SEPOLIA_ENS_PUBLIC_RESOLVER = '0x8948458626811dd0c23eb25cc74291247077cc51'

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
})

export const getAppInfo = async (appName: string) => {
  const target = `${appName}.kon.eth`

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

export const sendSetTextCalls = (
  fromAddress: string,
  appName: string,
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
    args: [node, ENS_APP_KEY, value]
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
          description: `💡 You are updating application: "${appName}.${ENS_APP_BASE}". (🔄 setText "${ENS_APP_KEY}" on ENS: "${target}")`,
          transactionType: 'call',
          networkId: sepolia.id
        }
      }
    ]
  }
}
