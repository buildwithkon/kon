import { fmtNum } from '@konxyz/shared/lib/format'
import type { RootLoader } from '@konxyz/shared/types'
import { QrCode } from '@phosphor-icons/react'
import { useRouteLoaderData } from 'react-router'
import { useAccount } from 'wagmi'
import Avatar from '~/components/Avatar'
import QrDialog from '~/components/QrDialog'

export default function ProfileCard({
  qr = true,
  point,
  name,
  id
}: { qr?: boolean; point?: number; name?: string; id?: string }) {
  const { address } = useAccount()
  const ld = useRouteLoaderData<RootLoader>('root')

  return (
    <div
      className={
        'shine-overlay relative aspect-golden w-full overflow-hidden rounded-xl bg-main p-8 text-main-fg shadow-2xl dark:shadow-white/5'
      }
    >
      <div className="shine" />
      <div className="-mt-2 line-clamp-3 h-auto w-2/3 break-words pr-1 font-bold text-3xl">
        {ld?.appConfig?.name ?? ''}
      </div>
      <div className="absolute top-6 right-6 mx-auto">
        {ld?.appConfig?.icons?.logo && (
          <img
            src={ld?.appConfig?.icons?.logo}
            className="max-h-24 max-w-24 rounded-full"
            alt={ld?.appConfig?.name ?? ''}
          />
        )}
      </div>
      <div className="absolute bottom-6 left-6 flex w-9/12 flex-nowrap items-center overflow-hidden">
        <Avatar name={address ?? ''} className="flex w-[52px] shrink-0" />
        <div className="-mt-1 flex-col pl-2.5">
          <div className="min-w-2/3 truncate font-bold text-lg">
            {name ? (
              <span>
                {name} {id && <span className="font-normal text-base opacity-90">({id})</span>}
              </span>
            ) : id ? (
              id
            ) : (
              'Your Name'
            )}
          </div>
          <div className="-mt-0.5 flex items-center font-mono">
            <span className="px-0.5">
              {fmtNum(point)}
              <span className="px-0.5">pts</span>
            </span>
          </div>
        </div>
      </div>
      {qr ? (
        <QrDialog>
          <button type="button">
            <QrCode size={52} weight="duotone" className="absolute right-4 bottom-5" />
          </button>
        </QrDialog>
      ) : (
        <QrCode size={52} weight="duotone" className="absolute right-4 bottom-5" />
      )}
    </div>
  )
}
