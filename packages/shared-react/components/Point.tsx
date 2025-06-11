import { useCoinBalance } from '~/hooks/useWallet'

export default function Point({ address }: { address: `0x${string}` | undefined }) {
  const { data, coin, isLoading } = useCoinBalance(address)

  return isLoading ? (
    <div className="h-5 w-12 animate-pulse rounded-full bg-gray-500/50" />
  ) : coin ? (
    <span className="flex items-end px-0.5 font-mono">
      {data?.formatted ?? 0}
      <span className="px-0.5 text-sm italic">pt{data?.value > 1 ? 's' : ''}</span>
    </span>
  ) : null
}
