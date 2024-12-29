import { getWagmiConfig } from '@konxyz/shared/lib/wagmi'
import { useRouteLoaderData } from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { type ReactNode, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { cookieToInitialState } from 'wagmi'
import { store } from '~/atoms'
import type { RootLoader } from '~/root'

export default function AppProviders({
  children
}: {
  children: ReactNode
}) {
  const ld = useRouteLoaderData<RootLoader>('root')
  const [config] = useState(() => getWagmiConfig(ld?.ENV, ld?.appConfig))
  const [queryClient] = useState(() => new QueryClient())

  return (
    <JotaiProvider store={store}>
      <WagmiProvider config={config} initialState={cookieToInitialState(config, ld?.cookie)}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </JotaiProvider>
  )
}
