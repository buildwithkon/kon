import { useAccount } from 'wagmi'
import Skelton from '~/components/Skelton'
import { useCoinBalance } from '~/hooks/useWallet'

const DUMMY_REWARDS = [
  {
    title: '🏷️ 10% off ticket',
    description: '10% off next purchase',
    value: 1
  },
  {
    title: '☕ 1 free coffee',
    description: '1 free coffee next time',
    value: 10
  },
  {
    title: '💎 VIP',
    description: 'You are VIP',
    value: 10000
  }
]

export default function Rewards({ coin }: { coin: { chainId: number; address: `0x${string}` } }) {
  const { address } = useAccount()
  const { data, isLoading } = useCoinBalance(address, coin?.chainId, coin?.address)

  return isLoading ? (
    <div className="flex flex-col gap-4">
      <Skelton className="h-10 w-1/2" />
      <Skelton className="h-16 w-full" />
      <Skelton className="h-16 w-full" />
      <Skelton className="h-16 w-full" />
    </div>
  ) : coin ? (
    <div className="border-muted border-t pt-6">
      <h2 className="font-bold text-xl">🎁 Rewards</h2>
      <ul className="flex flex-col gap-3 px-1 pt-3">
        {DUMMY_REWARDS.map((item) => (
          <li
            key={item.title}
            className="relative flex items-center justify-between rounded-lg border border-muted"
          >
            <div className="p-4">
              <p className="font-bold">{item.title}</p>
              <p className="px-0.5 text-muted text-sm">{item.description}</p>
            </div>
            <div className="p-4">
              <p className="font-mono">
                {BigInt(item.value).toLocaleString('en-US')}
                <span className="pl-0.5 text-sm italic">pt{item.value > 1 ? 's' : ''}</span>
              </p>
              {BigInt(data?.value ?? 0n) > BigInt(item.value) && (
                <div className="absolute top-0 right-0 rounded-tr-lg bg-accent py-0.5 pr-2.5 pl-2 text-xs">
                  Redeemable
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  ) : null
}
