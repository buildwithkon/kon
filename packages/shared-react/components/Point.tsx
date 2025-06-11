import Skelton from '~/components/Skelton'
import { useCoinBalance } from '~/hooks/useWallet'

export default function Point({
  address,
  coin
}: { address: `0x${string}` | undefined; coin: { chainId: number; address: `0x${string}` } }) {
  const { data, isLoading } = useCoinBalance(address, coin?.chainId, coin?.address)

  return (
    <span className="flex items-end px-0.5 font-mono">
      {isLoading ? <Skelton className="h-4 w-10" /> : <span>{data?.formatted ?? 0}</span>}
      <span className="px-0.5 text-sm italic">pt{data?.value > 1 ? 's' : ''}</span>
    </span>
  )
}
