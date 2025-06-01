import { Client, type Conversation, type Signer } from '@xmtp/browser-sdk'
import { atom, useAtom, useSetAtom } from 'jotai'
import { useCallback, useRef } from 'react'
import { isLoadingAtom } from '~/components/AppHandler'

// Atoms for XMTP state
export const xmtpClientAtom = atom<Client | undefined>(undefined)
export const xmtpConversationsAtom = atom<Conversation[]>([])
export const xmtpConversationAtom = atom<Conversation>({} as Conversation)
export const xmtpErrorAtom = atom<string | undefined>(undefined)

export function useXMTP() {
  const [client, setClient] = useAtom(xmtpClientAtom)
  const [conversation, setConversation] = useAtom(xmtpConversationAtom)
  const [conversations, setConversations] = useAtom(xmtpConversationsAtom)
  const setIsLoading = useSetAtom(isLoadingAtom)
  const setError = useSetAtom(xmtpErrorAtom)
  // client is initializing
  const initializingRef = useRef<boolean>(false)

  // Initialize XMTP clxmtp
  const initialize = useCallback(
    async (signer: Signer) => {
      // only initialize a client if one doesn't already exist
      console.log('xmtp----0', signer, client)
      if (!client) {
        // if the client is already initializing, don't do anything
        if (initializingRef.current) {
          return undefined
        }
        // flag the client as initializing
        initializingRef.current = true
        setError(undefined)
        setIsLoading(true)

        try {
          const xmtpClient = await Client.create(signer, {
            env: 'dev',
            loggingLevel: 'debug'
          })
          setClient(xmtpClient)
          const states: any = await xmtpClient.preferences.inboxState()
          await xmtpClient.conversations.sync()
          const conv = await xmtpClient.conversations.list()
          console.log('xmtp----100000', conv, states)
        } catch (e: any) {
          console.log(e)
          setError(e.message || 'Failed to initialize XMTP')
          setClient(undefined)
          setConversations([])
        } finally {
          initializingRef.current = false
          setIsLoading(false)
        }
      }
      return client
    },
    [client, setClient, setConversations, setIsLoading, setError]
  )

  const disconnect = useCallback(() => {
    if (client) {
      client.close()
      setClient(undefined)
    }
  }, [setClient, client])

  const getConversations = useCallback(async () => {
    const res = await client?.conversations.list()
    console.log(client, 'getConversations:----')
    setConversations(res) // Reset conversations before fetching
  }, [client, setConversations])

  const getConversation = useCallback(
    async (conversationId: string) => {
      console.log(client, 'getConversation:----', conversationId)
      if (!client) {
        return
      }
      try {
        const conversation = await client.conversations.getConversationById(conversationId)

        console.log('getConversation:----', conversation)
        if (conversation) {
          setConversation(conversation)
        } else {
          throw new Error('Conversation not found')
        }
      } catch (error: any) {
        console.error('Error fetching conversation:', error)
        setError(error.message || 'Failed to fetch conversation')
        throw error
      }
    },
    [client, setConversation, setError]
  )

  return {
    client,
    conversation,
    conversations,
    getConversation,
    getConversations,
    initialize,
    disconnect
  }
}
