import { CaretCircleLeft } from '@phosphor-icons/react'
import { Link } from '@remix-run/react'

export default function TopBar({ backUrl, children }: { backUrl?: string; children: React.ReactNode }) {
  return (
    <div className="content fixed top-0 right-0 left-0 z-40 h-16">
      <div className="mx-auto flex h-full max-w-screen-xs items-center px-4">
        <div className="flex h-full w-full items-center pt-1 font-bold text-3xl">
          {backUrl && (
            <Link to={backUrl}>
              <CaretCircleLeft size={32} weight="bold" className="-mt-1 mr-2.5 text-muted" />
            </Link>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
