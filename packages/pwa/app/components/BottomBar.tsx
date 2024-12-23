import { usePwa } from '@dotmind/react-use-pwa'
import { cn } from '@konxyz/shared/lib/utils'
import { ChatsCircle, House, TextIndent as Menu, UsersThree } from '@phosphor-icons/react'
import { Link, useLocation } from '@remix-run/react'

export default function BottomBar() {
  const { isStandalone } = usePwa()

  return (
    <footer
      className={cn(
        'fixed right-0 bottom-0 left-0 z-40 rounded-t-3xl bg-main text-main-fg',
        isStandalone ? 'h-20 pb-4' : 'h-16'
      )}
    >
      <div className="mx-auto flex h-full max-w-screen-xs justify-around px-6">
        <BottomBarItem to="/home">
          <House size={42} />
        </BottomBarItem>
        <BottomBarItem to="/forum">
          <ChatsCircle size={42} />
        </BottomBarItem>
        <BottomBarItem to="/members">
          <UsersThree size={42} />
        </BottomBarItem>
        <BottomBarItem to="/misc">
          <Menu size={42} />
        </BottomBarItem>
      </div>
    </footer>
  )
}

const BottomBarItem = ({ children, to }: { children: React.ReactNode; to: string }) => {
  const { pathname } = useLocation()

  return (
    <Link
      className={cn(
        'flex h-full w-16 items-center justify-center border-t-4 pb-1 text-main-fg hover:opacity-70',
        pathname === to ? 'border-main-fg' : 'border-transparent'
      )}
      to={to}
    >
      {children}
    </Link>
  )
}
