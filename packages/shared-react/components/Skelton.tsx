import { cn } from '@konxyz/shared/lib/utils'

export default function Skelton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('animate-pulse rounded-2xl bg-gray-500/50', className)} style={style} />
}
