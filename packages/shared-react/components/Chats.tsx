import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import { Link } from 'react-router'
import Avatar from '~/components/Avatar'
import ChatInput from '~/components/ChatInput'
import { useXMTP } from '~/hooks/useXMTP'

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

export default function Chats({ children }: { children?: React.ReactNode }) {
  const { conversations } = useXMTP()

  return (
    <div
      className={cn(
        'flex flex-col justify-between',
        isStandalone() ? 'min-h-[calc(100dvh-9.5rem)]' : 'min-h-[calc(100dvh-8rem)]'
      )}
    >
      {conversations && conversations.length > 0 && <ChatLists />}
      {children}
      <ChatInput />
    </div>
  )
}

const ChatLists = () => {
  const { conversations } = useXMTP()

  return (
    <ul className="oveflow-y-scroll over-flow-x-hidden">
      {conversations.map((conv) => (
        <li key={`inbox-${conv.id}`} className="flex min-h-18 items-center border-muted border-b">
          <Link to={`/forum/${conv.id}`} className="flex h-full min-h-18 w-full items-center">
            <div className="px-5 py-2">
              <img src={conv?.imageUrl} alt={conv?.name} className="h-10 w-10 rounded-full" />
            </div>
            <div className="font-medium">
              <p>{conv?.name}</p>
              <p className="text-muted text-xs">test test</p>
              {conv?.description && <p className="text-muted text-xs">{conv?.description}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

const ChatSingle = () => {
  // TODO: update
  const isMe = (id: string) => id === '0x000011111'

  return (
    <div className="oveflow-y-scroll over-flow-x-hidden flex-1 px-4 pt-6">
      {CHATS.map((chat) => (
        <div className={cn('mb-5 flex w-full', isMe(chat.id) ? 'justify-end pl-17' : 'pr-8')} key={chat.id}>
          {!isMe(chat.id) && (
            <div className="mr-2.5 flex items-start justify-center pt-1">
              <Avatar name={chat.id} className="h-8 w-8" />
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
