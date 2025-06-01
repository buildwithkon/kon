import type { Identifier, Signer } from '@xmtp/browser-sdk'
import { type Hex, toBytes } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

export const isValidInboxId = (inboxId: string): inboxId is string => /^[a-z0-9]{64}$/.test(inboxId)

export const createEphemeralSigner = (privateKey: Hex): Signer => {
  const account = privateKeyToAccount(privateKey)
  return {
    type: 'EOA',
    getIdentifier: (): Identifier => ({
      identifier: account.address.toLowerCase(),
      identifierKind: 'Ethereum'
    }),
    signMessage: async (message: string) => {
      const signature = await account.signMessage({
        message
      })
      return toBytes(signature)
    }
  }
}

export const createEOASigner = (
  address: `0x${string}`,
  signMessage: (message: string) => Promise<string> | string
): Signer => {
  return {
    type: 'EOA',
    getIdentifier: (): Identifier => ({
      identifier: address.toLowerCase(),
      identifierKind: 'Ethereum'
    }),
    signMessage: async (message: string) => {
      const signature = await signMessage(message)
      return toBytes(signature)
    }
  }
}

export const createSCWSigner = (
  address: `0x${string}`,
  signMessage: (message: string) => Promise<string> | string,
  chainId: number | bigint
): Signer => {
  return {
    type: 'SCW',
    getIdentifier: () => ({
      identifier: address.toLowerCase(),
      identifierKind: 'Ethereum'
    }),
    signMessage: async (message: string) => {
      const signature = await signMessage(message)
      const signatureBytes = toBytes(signature)
      return signatureBytes
    },
    getChainId: () => BigInt(chainId ?? 1n)
  }
}
