import { cn } from '@konxyz/shared/lib/utils'
import type { AppConfig } from '@konxyz/shared/types'
import { CaretCircleUpIcon, QrCodeIcon } from '@phosphor-icons/react'
import { useDebounce, useWindowScroll } from '@uidotdev/usehooks'
import { useAccount } from 'wagmi'
import Avatar from '~/components/Avatar'
import Name from '~/components/Name'
import Point from '~/components/Point'
import QrDialog from '~/components/QrDialog'

export default function ProfileCard({
  appConfig,
  showQr = false,
  isSticky = false
}: {
  showQr?: boolean
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
              {(appConfig?.icons?.logoBgTransparent || appConfig?.icons?.logo) && (
                <img
                  src={appConfig?.icons?.logoBgTransparent ?? appConfig?.icons?.logo}
                  className="max-h-20 max-w-20 rounded-full"
                  alt={appConfig?.name ?? ''}
                />
              )}
            </div>
          )}
          {!isScrolled && (
            <div className="absolute bottom-5 left-6 flex w-9/12 flex-nowrap items-center overflow-hidden">
              <Avatar address={address} className="flex w-[52px] shrink-0 border border-gray-500/50" />
              <div className="flex-col pl-2.5">
                <div className="mt-0.5 min-w-2/3 truncate font-bold leading-tight">
                  <Name address={address} />
                </div>
                {appConfig?.coin?.chainId && appConfig?.coin?.address && (
                  <Point address={address} coin={appConfig.coin} />
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
