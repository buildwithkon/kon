import { cn } from '@konxyz/shared/lib/utils'
import BoringAvatar from 'boring-avatars'

// @ts-ignore
const BoringAvatar2 = typeof BoringAvatar.default !== 'undefined' ? BoringAvatar.default : BoringAvatar

type Variant = 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus'

export default function Avatar({
  name,
  variant = 'beam',
  size = 52,
  className
}: { name: string; size?: number; className?: string; variant?: Variant }) {
  return (
    <BoringAvatar2
      variant={variant}
      name={name ?? ''}
      size={size}
      className={cn('rounded-full', className)}
    />
  )
}
