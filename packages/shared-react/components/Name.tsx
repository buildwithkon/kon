import { useName } from '~/hooks/useWallet'

export default function Name({ address }: { address: `0x${string}` | undefined }) {
  const { name, isLoading } = useName(address)
  const [id, rest] = (name ?? '').match(/^([^.]+)\.(.+)$/)?.slice(1) ?? [name ?? '', '']

  return isLoading ? (
    <div className="h-5 w-32 animate-pulse rounded-full bg-gray-500/50" />
  ) : id && rest ? (
    <span>
      {id}
      <span className="opacity-80">.{rest}</span>
    </span>
  ) : (
    <span>{name}</span>
  )
}
