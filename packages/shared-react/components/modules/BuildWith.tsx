import { SITE_URL } from '@konxyz/shared/lib/const'
import { cn } from '@konxyz/shared/lib/utils'
import IconKon from '~/components/svg/kon'

export default function BuildWith({ className }: { className?: string }) {
  return (
    <div className={cn('my-6 text-center font-mono text-sm', className)}>
      <a href={SITE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center">
        Build with <IconKon size={28} className="-mt-0.5 ml-1" /> <strong>KON</strong>
      </a>
    </div>
  )
}
