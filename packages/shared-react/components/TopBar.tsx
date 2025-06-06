import { CaretCircleLeftIcon } from '@phosphor-icons/react'
import { Link } from 'react-router'
import ConfigDialog from '~/components/ConfigDialog'
import XMTPConfigDialog from '~/components/XMTPConfigDialog'

export default function TopBar({
  backBtn,
  title,
  rightBtn
}: { backBtn?: string | true; title?: string | React.ReactNode; rightBtn?: 'config' | 'xmtp' | undefined }) {
  return (
    <nav className="topbar content fixed top-0 right-0 left-0 z-40 h-16 shadow-gray-400/10 shadow-lg">
      <div className="mx-auto flex h-full max-w-screen-xs items-center px-4">
        <div className="flex h-full w-full items-center justify-between pt-1 font-bold text-3xl">
          <span className="flex items-center">
            {backBtn && (
              <Link to={typeof backBtn === 'boolean' ? '/home' : backBtn}>
                <CaretCircleLeftIcon size={30} className="mr-3 text-muted" />
              </Link>
            )}
            {title ?? ''}
          </span>
          {rightBtn === 'config' && <ConfigDialog />}
          {rightBtn === 'xmtp' && <XMTPConfigDialog />}
        </div>
      </div>
    </nav>
  )
}
