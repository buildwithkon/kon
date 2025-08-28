import {
  type ContentTypeId,
  type ContentTypes,
  createEOASigner,
  createSCWSigner,
  initialize
} from '@konxyz/shared/lib/xmtp'
import type {
  Client,
  Conversation,
  DecodedMessage,
  Identifier,
  SafeCreateGroupOptions,
  SafeListConversationsOptions,
  SafeListMessagesOptions
} from '@xmtp/browser-sdk'
import { atom, useAtom, useAtomValue } from 'jotai'
import { useCallback, useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useCurrentConnector } from '~/hooks/useWallet'

// Atoms for XMTP state
export const xmtpClientAtom = atom<Client | undefined>(undefined)
export const xmtpConvAtom = atom<Conversation<ContentTypes>[] | undefined>([])

export function useXMTP() {
  const [client, setClient] = useAtom(xmtpClientAtom)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { isSCW } = useCurrentConnector()
  const { address, chainId } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const connect = useCallback(async () => {
    if (client) {
      return
    }
    // if wallet is not connected or SCW is enabled but chain is not set, return
    if (!address || (isSCW && !chainId)) {
      return
    }
    try {
      setIsLoading(true)
      const client = await initialize(
        isSCW
          ? createSCWSigner(address, (message: string) => signMessageAsync({ message }))
          : createEOASigner(address, (message: string) => signMessageAsync({ message }))
      )
      setClient(client)
    } catch (error) {
      console.error('Error initializing XMTP client:', error)
    } finally {
      setIsLoading(false)
    }
  }, [address, chainId, isSCW, client, signMessageAsync, setClient])

  const disconnect = useCallback(() => {
    if (client) {
      client.close()
      setClient(undefined)
    }
  }, [client, setClient])

  return {
    client,
    connect,
    disconnect,
    isLoading
  }
}

export const useXMTPConversations = () => {
  const client = useAtomValue(xmtpClientAtom)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [conversations, setConversations] = useAtom(xmtpConvAtom)

  if (!client) {
    throw new Error('XMTP client not initialized')
  }

  const list = async (options?: SafeListConversationsOptions, syncFromNetwork: boolean = false) => {
    if (syncFromNetwork) {
      await sync()
    }

    setIsLoading(true)

    try {
      const convos = await client.conversations.list(options)
      setConversations(convos)
      return convos
    } finally {
      setIsLoading(false)
    }
  }

  const sync = async () => {
    setIsSyncing(true)

    try {
      await client.conversations.sync()
    } finally {
      setIsSyncing(false)
    }
  }

  const syncAll = async () => {
    setIsSyncing(true)

    try {
      await client.conversations.syncAll()
    } finally {
      setIsSyncing(false)
    }
  }

  const getConversationById = async (conversationId: string) => {
    setIsLoading(true)

    try {
      const conversation = await client.conversations.getConversationById(conversationId)
      return conversation
    } finally {
      setIsLoading(false)
    }
  }

  const getMessageById = async (messageId: string) => {
    setIsLoading(true)

    try {
      const message = await client.conversations.getMessageById(messageId)
      return message
    } finally {
      setIsLoading(false)
    }
  }

  const newGroup = async (inboxIds: string[], options?: SafeCreateGroupOptions) => {
    setIsLoading(true)

    try {
      const conversation = await client.conversations.newGroup(inboxIds, options)
      return conversation
    } finally {
      setIsLoading(false)
    }
  }

  const newGroupWithIdentifiers = async (identifiers: Identifier[], options?: SafeCreateGroupOptions) => {
    setIsLoading(true)

    try {
      const conversation = await client.conversations.newGroupWithIdentifiers(identifiers, options)
      return conversation
    } finally {
      setIsLoading(false)
    }
  }

  const newDm = async (inboxId: string) => {
    setIsLoading(true)

    try {
      const conversation = await client.conversations.newDm(inboxId)
      return conversation
    } finally {
      setIsLoading(false)
    }
  }

  const newDmWithIdentifier = async (identifier: Identifier) => {
    setIsLoading(true)

    try {
      const conversation = await client.conversations.newDmWithIdentifier(identifier)
      return conversation
    } finally {
      setIsLoading(false)
    }
  }

  const stream = async () => {
    const onValue = (conversation: Conversation<ContentTypes>) => {
      const shouldAdd =
        conversation.metadata?.conversationType === 'dm' ||
        conversation.metadata?.conversationType === 'group'
      if (shouldAdd) {
        setConversations((prev) => [conversation, ...prev])
      }
    }

    const stream = await client.conversations.stream({
      onValue
    })

    return () => {
      void stream.end()
    }
  }

  return {
    conversations,
    getConversationById,
    getMessageById,
    list,
    isLoading,
    newDm,
    newDmWithIdentifier,
    newGroup,
    newGroupWithIdentifiers,
    stream,
    sync,
    syncAll,
    isSyncing
  }
}

export const useXMTPConversation = (conversation: Conversation<ContentTypes>) => {
  const { client } = useXMTP()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [isSending, setIsSending] = useState<boolean>(false)
  const [messages, setMessages] = useState<DecodedMessage<ContentTypes>[]>([])

  const getMessages = async (options?: SafeListMessagesOptions, syncFromNetwork: boolean = false) => {
    if (!client) {
      return
    }

    setMessages([])
    setIsLoading(true)

    if (syncFromNetwork) {
      await sync()
    }

    try {
      const msgs = await conversation.messages(options)
      setMessages(msgs)
      return msgs
    } finally {
      setIsLoading(false)
    }
  }

  const sync = async () => {
    if (!client) {
      return
    }

    setIsSyncing(true)

    try {
      await conversation.sync()
    } finally {
      setIsSyncing(false)
    }
  }

  const send = async (message: ContentTypes, contentType?: ContentTypeId) => {
    if (!client) {
      return
    }

    setIsSending(true)

    try {
      await conversation.send(message, contentType)
    } finally {
      setIsSending(false)
    }
  }

  const streamMessages = async () => {
    const noop = () => {}
    if (!client) {
      return noop
    }

    const onValue = (message: DecodedMessage<ContentTypes>) => {
      setMessages((prev) => [...prev, message])
    }

    const stream = await conversation.stream({
      onValue
    })

    return () => stream.end()
  }

  return {
    getMessages,
    isLoading,
    messages,
    send,
    isSending,
    streamMessages,
    sync,
    isSyncing
  }
}
