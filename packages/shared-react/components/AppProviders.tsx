import { OnchainKitProvider } from '@coinbase/onchainkit'
import { getWagmiConfig } from '@konxyz/shared/lib/wagmi'
import type { RootLoader } from '@konxyz/shared/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { type ReactNode, useState } from 'react'
import { base, baseSepolia } from 'viem/chains'
import { WagmiProvider, cookieToInitialState } from 'wagmi'
import { store } from '~/atoms'

export default function AppProviders({
  children,
  ld
}: {
  children: ReactNode
  ld: RootLoader
}) {
  const [wagmiConfig] = useState(() => getWagmiConfig(ld?.ENV, ld?.appConfig))
  const [queryClient] = useState(() => new QueryClient())

  return (
    <JotaiProvider store={store}>
      <WagmiProvider config={wagmiConfig} initialState={cookieToInitialState(wagmiConfig, ld?.cookie)}>
        <QueryClientProvider client={queryClient}>
          <OnchainKitProvider apiKey={ld?.ENV?.CDP_CLIENT_API_KEY} chain={baseSepolia ?? base}>
            {children}
          </OnchainKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </JotaiProvider>
  )
}
