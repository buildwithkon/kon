import type { AppConfig } from '@konxyz/shared/types'
import { useAccount } from 'wagmi'
import Skelton from '~/components/Skelton'
import { useCoinBalance } from '~/hooks/useWallet'

export default function Rewards({ appConfig }: { appConfig: AppConfig }) {
  const { address } = useAccount()
  const { data, isLoading } = useCoinBalance(address, appConfig?.coin?.chainId, appConfig?.coin?.address)

  return isLoading ? (
    <div className="flex flex-col gap-4">
      <Skelton className="h-10 w-1/2" />
      <Skelton className="h-16 w-full" />
      <Skelton className="h-16 w-full" />
      <Skelton className="h-16 w-full" />
    </div>
  ) : appConfig?.coin && appConfig?.rewards ? (
    <div className="border-muted border-t pt-6">
      <h2 className="font-bold text-xl">🎁 Rewards</h2>
      <ul className="flex flex-col gap-3 px-1 pt-3">
        {appConfig?.rewards.map((item) => (
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
