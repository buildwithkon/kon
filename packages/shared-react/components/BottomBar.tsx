import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import type { AppConfig } from '@konxyz/shared/types'
import { NavLink } from 'react-router'
import { BottomBarIcon } from '~/components/Icon'

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
        'fixed right-0 bottom-0 left-0 z-40 rounded-none xs:rounded-t-3xl bg-main text-main-fg shadow-up',
        isStandalone() ? 'h-22 pb-6' : 'h-16'
      )}
    >
      <div className="mx-auto flex h-full max-w-screen-xs justify-around px-4">
        {tabs.map((item: TabItem) => (
          <BottomBarItem key={`bottom-bar-${item.id}`} id={item.id} icon={item?.icon} />
        ))}
      </div>
    </footer>
  )
}

const BottomBarItem = ({ id, icon }: { id: string; icon?: string }) => (
  <NavLink
    className={({ isActive }) =>
      cn(
        'flex h-full w-16 items-center justify-center border-t-3 pb-1 text-main-fg hover:opacity-70',
        isActive ? 'border-accent' : 'border-transparent'
      )
    }
    to={`/${id}`}
  >
    {({ isActive }) => BottomBarIcon(id, isActive, icon)}
  </NavLink>
)
