import { QrCode } from '@phosphor-icons/react'
import { useAccount } from 'wagmi'
import Avatar from '~/components/Avatar'
import QrDrawer from '~/components/QrDrawer'

export default function ProfileCard() {
  const { address } = useAccount()

  return (
    <div className="shine-overlay relative h-60 w-full overflow-hidden rounded-xl bg-main p-8 text-main-fg shadow-2xl dark:shadow-white/5">
      <div className="shine" />
      <div className="absolute top-6 right-6">
        <Avatar name={address ?? ''} />
      </div>
      <div className="absolute bottom-4 left-6">
        <div className="mb-1 font-bold text-3xl">yuji</div>
        <div className="flex items-center font-mono text-lg">
          <span className="px-1">
            1,000<span className="px-0.5">pts</span>
          </span>
        </div>
      </div>
      <QrDrawer>
        <button type="button">
          <QrCode size={60} weight="duotone" className="absolute top-5 left-5" />
        </button>
      </QrDrawer>
    </div>
  )
}
