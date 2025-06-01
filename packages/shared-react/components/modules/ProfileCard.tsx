import { fmtNum } from '@konxyz/shared/lib/format'
import { cn } from '@konxyz/shared/lib/utils'
import type { AppConfig } from '@konxyz/shared/types'
import { CaretCircleUpIcon, QrCodeIcon } from '@phosphor-icons/react'
import { useDebounce, useWindowScroll } from '@uidotdev/usehooks'
import { useAccount } from 'wagmi'
import Avatar from '~/components/Avatar'
import QrDialog from '~/components/QrDialog'

export default function ProfileCard({
  appConfig,
  showQr = false,
  point,
  name,
  id,
  isSticky = false
}: {
  showQr?: boolean
  point?: number
  name?: string
  id?: string
  isSticky?: boolean
  appConfig: AppConfig
}) {
  const { address } = useAccount()
  const [{ y }, scrollTo] = useWindowScroll()
  const deboucedY = useDebounce((y ?? 0) > 125, 300)
  const isScrolled = isSticky && deboucedY

  return (
    <div className={cn(isSticky ? 'sticky top-6 z-10' : '')}>
      <div className={cn('aspect-golden w-full')}>
        <div
          className={cn(
            'shine-overlay relative rounded-xl bg-main p-8 text-main-fg shadow-2xl shadow-gray-500/10',
            'overflow-hidden transition-all duration-300 ease-in-out',
            isScrolled ? 'h-20' : 'h-full'
          )}
        >
          {!isScrolled && <div className="shine" />}
          <div className="-mt-2 line-clamp-3 h-auto w-2/3 break-words pr-1 font-bold text-2xl">
            {appConfig?.name ?? ''}
          </div>
          {isScrolled && (
            <button
              type="button"
              className="absolute top-6 right-6 text-accent"
              onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <CaretCircleUpIcon size={32} />
            </button>
          )}
          {!isScrolled && (
            <div className="absolute top-6 right-6 mx-auto">
              {appConfig?.icons?.logo && (
                <img src={appConfig?.icons?.logo} className="max-h-20 max-w-20" alt={appConfig?.name ?? ''} />
              )}
            </div>
          )}
          {!isScrolled && (
            <div className="absolute bottom-5 left-6 flex w-9/12 flex-nowrap items-center overflow-hidden">
              <Avatar name={address ?? ''} className="flex w-[52px] shrink-0 border border-gray-500/50" />
              <div className="flex-col pl-2.5">
                <div className="mt-0.5 min-w-2/3 truncate font-bold leading-tight">
                  {name ? (
                    <span>
                      {name}
                      <br />
                      {id && <span className="pl-0.5 font-normal text-sm opacity-90">{id}</span>}
                    </span>
                  ) : id ? (
                    id
                  ) : (
                    'Your Name'
                  )}
                </div>
                {point && (
                  <div className="-mt-0.5 flex items-center font-mono">
                    <span className="px-0.5">
                      {fmtNum(point)}
                      <span className="px-0.5">pts</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          {!isScrolled ? (
            showQr ? (
              <QrDialog>
                <QrCodeIcon size={52} weight="duotone" className="absolute right-4 bottom-5" />
              </QrDialog>
            ) : (
              <QrCodeIcon size={52} weight="duotone" className="absolute right-4 bottom-5" />
            )
          ) : null}
        </div>
      </div>
    </div>
  )
}
