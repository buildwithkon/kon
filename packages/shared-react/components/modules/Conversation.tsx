import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import { useEffect } from 'react'
import Avatar from '~/components/Avatar'
import ChatInput from '~/components/ChatInput'
import { type Client, useXMTP } from '~/hooks/useXMTP'

const CHATS = [
  {
    id: '0x00000',
    message: 'Today is fine!\nHow are you?aaaaaaaaaaaaaaaaaaaaaaa'
  },
  {
    id: '0x000011111',
    message: 'gm!gm!gm!gm!gm!gm!m!gm!gm!gm!gm! aaa'
  }
]

export default function Conversation({ client, children }: { client: Client; children?: React.ReactNode }) {
  const { conversation, conversations, getConversation, getConversations } = useXMTP()

  useEffect(() => {
    getConversation('8393bf5556b020d0feb28301ea231423')
    getConversations()
  }, [getConversation, getConversations])

  console.log('conv----', conversations, conversation)

  return (
    <div
      className={cn(
        'flex flex-col justify-between',
        isStandalone() ? 'min-h-[calc(100dvh-9.5rem)]' : 'min-h-[calc(100dvh-8rem)]'
      )}
    >
      <Chats />
      {children}
      <ChatInput />
    </div>
  )
}

const Chats = () => {
  // TODO: update
  const isMe = (id: string) => id === '0x000011111'

  return (
    <div className="oveflow-y-scroll over-flow-x-hidden flex-1 px-4 pt-6">
      {CHATS.map((chat) => (
        <div className={cn('mb-5 flex w-full', isMe(chat.id) ? 'justify-end pl-17' : 'pr-8')} key={chat.id}>
          {!isMe(chat.id) && (
            <div className="mr-2.5 flex items-start justify-center pt-1">
              <Avatar name={chat.id} className="h-8 w-8 rounded-full" />
            </div>
          )}
          <div
            className={cn(
              'shawow-gray-500/10 text-wrap break-all rounded-lg px-4 py-2 shadow-sm',
              isMe(chat.id) ? 'bg-main text-main-fg' : 'bg-stone-300/50 dark:bg-stone-500/50'
            )}
          >
            {chat.message}
          </div>
        </div>
      ))}
    </div>
  )
}
