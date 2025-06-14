import { Client, type Conversation, type InboxState, type Signer } from '@xmtp/browser-sdk'
import { atom, useAtom, useSetAtom } from 'jotai'
import { useCallback, useRef } from 'react'
import { hexToUint8Array } from 'uint8array-extras'
import { isLoadingAtom } from '~/components/AppHandler'

// Atoms for XMTP state
export const xmtpClientAtom = atom<Client | undefined>(undefined)
export const xmtpInboxStateAtom = atom<InboxState | undefined>(undefined)
export const xmtpConversationsAtom = atom<Conversation[]>([])
export const xmtpConversationAtom = atom<Conversation>({} as Conversation)
export const xmtpErrorAtom = atom<string | undefined>(undefined)

export function useXMTP() {
  const [client, setClient] = useAtom(xmtpClientAtom)
  const [inboxState, setInboxState] = useAtom(xmtpInboxStateAtom)
  const [conversation, setConversation] = useAtom(xmtpConversationAtom)
  const [conversations, setConversations] = useAtom(xmtpConversationsAtom)
  const setIsLoading = useSetAtom(isLoadingAtom)
  const setError = useSetAtom(xmtpErrorAtom)
  // client is initializing
  const initializingRef = useRef<boolean>(false)

  // Initialize XMTP clxmtp
  const initialize = useCallback(
    async (signer: Signer, env = 'production') => {
      // only initialize a client if one doesn't already exist
      console.log('xmtp----0', signer, client)
      if (!client) {
        // if the client is already initializing, don't do anything
        if (initializingRef.current) {
          return undefined
        }
        console.log('xmtp----1', signer, client)
        // flag the client as initializing
        initializingRef.current = true
        setError(undefined)
        setIsLoading(true)

        console.log('xmtp----2')
        try {
          console.log('xmtp----3')
          const xmtpClient = await Client.create(signer, {
            env,
            loggingLevel: 'warn',
            dbEncryptionKey: hexToUint8Array(
              'f1f3868e413636f7e5940865fbb2cbd5a0e4b95904fc83588a65d8ec5aa157a7'
            )
            // codecs: [
            //   new ReactionCodec(),
            //   new ReplyCodec(),
            //   new RemoteAttachmentCodec(),
            //   new TransactionReferenceCodec(),
            //   new WalletSendCallsCodec()
            // ]
          })
          console.log('xmtp----4', xmtpClient)
          setClient(xmtpClient)
        } catch (e: any) {
          console.log('xmtp----99')
          return setClient(true)
          console.log(e)
          setError(e.message || 'Failed to initialize XMTP')
          setClient(undefined)
        } finally {
          initializingRef.current = false
          setIsLoading(false)
        }
      }
      return client
    },
    [client]
  )

  const disconnect = useCallback(() => {
    if (client) {
      client.close()
      setClient(undefined)
    }
  }, [setClient, client])

  const getInboxState = async () => {
    console.log('getInboxState:----', client)
    const res = await client?.preferences.inboxState()
    console.log('getInboxState:----', client, res)
    setInboxState(res)
  }

  const getConversations = async () => {
    await client?.conversations.syncAll()
    const res = await client?.conversations.list()
    console.log('getConversations:----', client, res)
    setConversations(res) // Reset conversations before fetching
  }

  const getConversation = async (conversationId: string) => {
    '---getConversation---0'
    if (!client) {
      return
    }
    try {
      ;('---getConversation---1')
      const conversation = await client.conversations.getConversationById(conversationId)
      await conversation?.sync()
      const msgs = await conversation?.messages()

      console.log('getConversation:----', conversation, msgs)
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
  }

  return {
    client,
    conversation,
    conversations,
    getConversation,
    getConversations,
    getInboxState,
    initialize,
    disconnect
  }
}

export type { Client }
