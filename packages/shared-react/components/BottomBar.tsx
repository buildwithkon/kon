import { cn, isStandalone } from '@konxyz/shared/lib/utils'
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
  const tabs = appConfig?.template?.tabs ?? []

  return (
    <footer
      className={cn(
        'fixed right-0 bottom-0 left-0 z-40 rounded-t-3xl bg-main text-main-fg',
        isStandalone() ? 'h-20 pb-4' : 'h-16'
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
        'flex h-full w-16 items-center justify-center border-t-3 pb-1 text-main-fg hover:opacity-70',
        isActive ? 'border-accent' : 'border-transparent'
      )
    }
    to={`/${id}`}
  >
    {({ isActive }) => renderIcon(id, isActive)}
  </NavLink>
)

const iconProps = (isActive: boolean) => ({
  size: 38,
  weight: isActive ? 'fill' : 'regular'
})

const renderIcon = (id: 'duotone' | 'fill' | 'regular', isActive: boolean) => {
  switch (id) {
    case 'home':
      return <House {...iconProps(isActive)} />
    case 'forum':
    case 'message':
    case 'messages':
    case 'dm':
      return <ChatsCircle {...iconProps(isActive)} />
    case 'info':
      return <Info {...iconProps(isActive)} />
    case 'schedule':
      return <CalendarCheck {...iconProps(isActive)} />
    case 'members':
    case 'users':
      return <UsersThree {...iconProps(isActive)} />
    case 'qa':
      return <Hand {...iconProps(isActive)} />
    case 'menu':
    case 'misc':
      return <Menu {...iconProps(isActive)} />
    default:
      return <Menu {...iconProps(isActive)} />
  }
}
