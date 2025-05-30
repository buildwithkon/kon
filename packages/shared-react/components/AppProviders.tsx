import { OnchainKitProvider } from '@coinbase/onchainkit'
import { getCdpConfig } from '@konxyz/shared/lib/cdp'
import { getWagmiConfig } from '@konxyz/shared/lib/wagmi'
import type { RootLoader } from '@konxyz/shared/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { type ReactNode, useState } from 'react'
import { WagmiProvider, cookieToInitialState } from 'wagmi'
import { store } from '~/atoms'
import Toast from '~/components/ui/Toast'

export default function AppProviders({
  children,
  ld
}: {
  children: ReactNode
  ld: RootLoader
}) {
  const [wagmiConfig] = useState(() => getWagmiConfig(ld))
  const [cdpConfig] = useState(() => getCdpConfig(ld))

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // With SSR, we usually want to set some default staleTime
            // above 0 to avoid refetching immediately on the client
            staleTime: 60 * 1000
          }
        }
      })
  )

  return (
    <JotaiProvider store={store}>
      <WagmiProvider config={wagmiConfig} initialState={cookieToInitialState(wagmiConfig, ld?.cookie)}>
        <QueryClientProvider client={queryClient}>
          <OnchainKitProvider {...cdpConfig}>
            <Toast>{children}</Toast>
          </OnchainKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </JotaiProvider>
  )
}
