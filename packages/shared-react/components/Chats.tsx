import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import Avatar from '~/components/Avatar'
import ChatInput from '~/components/ChatInput'

const CHATS = [
  {
    id: '0x00000',
    message: 'Today is fine!\nHow are you?aaaaaaaaaaaaaaaaaaaaaaa'
  },
  {
    id: '0x000011111',
    message: 'gm!'
  }
]

export default function Chats({ children }: { children?: React.ReactNode }) {
  return (
    <div
      className={cn(
        'flex flex-col justify-between',
        isStandalone() ? 'min-h-[calc(100dvh-9.5rem)]' : 'min-h-[calc(100dvh-8rem)]'
      )}
    >
      <ChatLists />
      {children}
      <ChatInput />
    </div>
  )
}

const ChatLists = () => {
  // TODO: update
  const isMe = (id: string) => id === '0x000011111'

  return (
    <div className="oveflow-y-scroll over-flow-x-hidden flex-1 px-4 pt-6">
      {CHATS.map((chat) => (
        <div className={cn('mb-5 flex w-full', isMe(chat.id) ? 'justify-end pl-4' : 'pr-4')} key={chat.id}>
          {!isMe(chat.id) && (
            <div className="mr-2.5 flex h-9 w-9 items-center justify-center">
              <Avatar name={chat.id} />
            </div>
          )}
          <div
            className={cn(
              'shawow-gray-500/10 max-w-96 rounded-lg px-4 py-2 shadow-sm',
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
