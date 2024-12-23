import { cn } from '@konxyz/shared/lib/utils'
import BoringAvatar from 'boring-avatars'

// @ts-ignore
const BoringAvatar2 = typeof BoringAvatar.default !== 'undefined' ? BoringAvatar.default : BoringAvatar

export default function Avatar({
  name,
  size = 52,
  className
}: { name: string; size?: number; className?: string }) {
  return (
    <BoringAvatar2
      variant="beam"
      name={name ?? ''}
      size={size}
      className={cn('rounded-full border-2 border-white/20', className)}
    />
  )
}
