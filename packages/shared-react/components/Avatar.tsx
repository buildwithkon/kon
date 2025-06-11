import { cn } from '@konxyz/shared/lib/utils'
import BoringAvatar from 'boring-avatars'
import Skelton from '~/components/Skelton'
import { useAvatar, useName } from '~/hooks/useWallet'

// @ts-ignore
const BoringAvatar2 = typeof BoringAvatar.default !== 'undefined' ? BoringAvatar.default : BoringAvatar

type Variant = 'marble' | 'beam' | 'pixel' | 'sunset' | 'ring' | 'bauhaus'

export default function Avatar({
  address,
  variant = 'beam',
  size = 52,
  className
}: { address?: `0x${string}` | undefined; size?: number; className?: string; variant?: Variant }) {
  const { name, isLoading: isLoadingName } = useName(address)
  const { avatar, isLoading: isLoadingAvatar } = useAvatar(name)

  return isLoadingName || isLoadingAvatar ? (
    <Skelton className={cn('rounded-full bg-gray-500/50', className)} style={{ width: size, height: size }} />
  ) : avatar ? (
    <img src={avatar} width={size} height={size} alt={name} className={cn('rounded-full', className)} />
  ) : (
    <BoringAvatar2
      variant={variant}
      name={name ?? ''}
      size={size}
      className={cn('rounded-full', className)}
    />
  )
}
