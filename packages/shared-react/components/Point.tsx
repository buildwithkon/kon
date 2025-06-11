import Skelton from '~/components/Skelton'
import { useCoinBalance } from '~/hooks/useWallet'

export default function Point({
  address,
  coin
}: { address: `0x${string}` | undefined; coin: { chainId: number; address: `0x${string}` } }) {
  const { data, isLoading } = useCoinBalance(address, coin?.chainId, coin?.address)

  return isLoading ? (
    <Skelton className="h-5 w-12" />
  ) : (
    <span className="flex items-end px-0.5 font-mono">
      {data?.formatted ?? 0}
      <span className="px-0.5 text-sm italic">pt{data?.value > 1 ? 's' : ''}</span>
    </span>
  )
}
