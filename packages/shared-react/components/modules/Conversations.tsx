import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import { Link } from 'react-router'
import Avatar from '~/components/Avatar'
import { useXMTP } from '~/hooks/useXMTP'

export default function Conversations({ children }: { children?: React.ReactNode }) {
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
              {conv?.imageUrl ? (
                <img src={conv?.imageUrl} alt={conv?.name} className="h-10 w-10 rounded-full" />
              ) : (
                <Avatar variant="ring" name={conv?.name} className="h-10 w-10 opacity-80" />
              )}
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
