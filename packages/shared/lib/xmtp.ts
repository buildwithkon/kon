import { Client, type ExtractCodecContentTypes, type Identifier, type Signer } from '@xmtp/browser-sdk'
import type { ReactionCodec } from '@xmtp/content-type-reaction'
import type { ReadReceiptCodec } from '@xmtp/content-type-read-receipt'
import type { RemoteAttachmentCodec } from '@xmtp/content-type-remote-attachment'
import type { ReplyCodec } from '@xmtp/content-type-reply'
import type { TransactionReferenceCodec } from '@xmtp/content-type-transaction-reference'
import type { WalletSendCallsCodec } from '@xmtp/content-type-wallet-send-calls'
import { type Hex, toBytes } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

export type { ContentTypeId } from '@xmtp/content-type-primitives'

export type ContentTypes = ExtractCodecContentTypes<
  [
    ReactionCodec,
    ReplyCodec,
    RemoteAttachmentCodec,
    TransactionReferenceCodec,
    WalletSendCallsCodec,
    ReadReceiptCodec
  ]
>

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

export const initialize = async (
  signer: Signer,
  env: 'production' | 'dev' | 'local' = 'production',
  loggingLevel: 'debug' | 'info' | 'warn' | 'error' = 'warn'
) => {
  const client = await Client.create(signer, {
    env,
    loggingLevel
  })
  return client
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
  chainId: bigint = 1n
): Signer => {
  return {
    type: 'SCW',
    getIdentifier: () => ({
      identifier: address.toLowerCase(),
      identifierKind: 'Ethereum'
    }),
    signMessage: async (message: string) => {
      const signature = await signMessage(message)
      return toBytes(signature)
    },
    getChainId: () => chainId
  }
}
