import { CaretCircleLeft } from '@phosphor-icons/react'
import { Link } from 'react-router'
import ConfigDialog from '~/components/ConfigDialog'

export default function TopBar({
  backBtn,
  title,
  rightBtn
}: { backBtn?: string | true; title?: string | React.ReactNode; rightBtn?: 'config' }) {
  return (
    <nav className="topbar content fixed top-0 right-0 left-0 z-40 h-16 shadow-black/5 shadow-lg dark:shadow-white/5">
      <div className="mx-auto flex h-full max-w-screen-xs items-center px-4">
        <div className="flex h-full w-full items-center justify-between pt-1 font-bold text-3xl">
          <span className="flex items-center">
            {backBtn && (
              <Link to={typeof backBtn === 'boolean' ? '/home' : backBtn}>
                <CaretCircleLeft size={32} weight="bold" className="-mt-1 mr-2.5 text-muted" />
              </Link>
            )}
            {title ?? ''}
          </span>
          {rightBtn === 'config' && <ConfigDialog />}
        </div>
      </div>
    </nav>
  )
}
