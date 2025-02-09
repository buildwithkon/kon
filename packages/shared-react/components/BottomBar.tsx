import { usePwa } from '@dotmind/react-use-pwa'
import { cn } from '@konxyz/shared/lib/utils'
import type { AppConfig } from '@konxyz/shared/types'
import {
  CalendarCheck,
  ChatsCircle,
  Hand,
  House,
  Books as Info,
  TextIndent as Menu,
  UsersThree
} from '@phosphor-icons/react'
import { NavLink } from 'react-router'

type TabItem = {
  id: string
  title?: string
  content: string
}

export default function BottomBar({ appConfig }: { appConfig: AppConfig | undefined }) {
  const { isStandalone } = usePwa()
  const tabs = appConfig?.template?.tabs ?? []

  return (
    <footer
      className={cn(
        'fixed right-0 bottom-0 left-0 z-40 rounded-t-3xl bg-main text-main-fg',
        isStandalone ? 'h-20 pb-4' : 'h-16'
      )}
    >
      <div className="mx-auto flex h-full max-w-screen-xs justify-around px-6">
        {tabs.map((item: TabItem) => (
          <BottomBarItem key={`bottom-bar-${item.id}`} id={item.id} />
        ))}
      </div>
    </footer>
  )
}

const BottomBarItem = ({ id }: { id: string }) => (
  <NavLink
    className={({ isActive }) =>
      cn(
        'flex h-full w-16 items-center justify-center border-t-4 pb-1 text-main-fg hover:opacity-70',
        isActive ? 'border-main-fg' : 'border-transparent'
      )
    }
    to={`/${id}`}
  >
    {renderIcon(id)}
  </NavLink>
)

const renderIcon = (id: string) => {
  switch (id) {
    case 'home':
      return <House size={42} />
    case 'forum':
    case 'message':
    case 'dm':
      return <ChatsCircle size={42} />
    case 'info':
      return <Info size={42} />
    case 'schedule':
      return <CalendarCheck size={42} />
    case 'members':
    case 'users':
      return <UsersThree size={42} />
    case 'qa':
      return <Hand size={42} />
    case 'menu':
    case 'misc':
      return <Menu size={42} />
    default:
      return <Menu size={42} />
  }
}
