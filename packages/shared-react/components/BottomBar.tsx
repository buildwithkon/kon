import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import type { AppConfig } from '@konxyz/shared/types'
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
        'fixed right-0 bottom-0 left-0 z-40 rounded-none xs:rounded-t-3xl bg-main text-main-fg shadow-black/5 shadow-up dark:shadow-white/5',
        isStandalone() ? 'h-22 pb-6' : 'h-16'
      )}
    >
      <div className="mx-auto flex h-full max-w-screen-xs justify-around px-4">
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

const renderIcon = (id: string, isActive: boolean) => {
  switch (id) {
    case 'home':
      return <ph-house size="36" weight={isActive ? 'fill' : 'regular'} />
    case 'forum':
    case 'message':
    case 'messages':
    case 'dm':
      return <ph-chats-circle size="36" weight={isActive ? 'fill' : 'regular'} />
    case 'info':
      return <ph-info size="36" weight={isActive ? 'fill' : 'regular'} />
    case 'schedule':
      return <ph-calendar-check size="36" weight={isActive ? 'fill' : 'regular'} />
    case 'members':
    case 'users':
      return <ph-users-three size="36" weight={isActive ? 'fill' : 'regular'} />
    case 'qa':
      return <ph-hand size="36" weight={isActive ? 'fill' : 'regular'} />
    case 'menu':
    case 'misc':
      return <ph-text-indent size="36" weight={isActive ? 'fill' : 'regular'} />
    default:
      return <ph-text-indent size="36" weight={isActive ? 'fill' : 'regular'} />
  }
}
