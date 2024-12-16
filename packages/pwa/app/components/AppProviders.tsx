import { useRouteLoaderData } from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { type ReactNode, useMemo, useState } from 'react'
import { WagmiProvider } from 'wagmi'
import { cookieToInitialState } from 'wagmi'
import { store } from '~/atoms'
import { getConfig } from '~/lib/wagmi'
import type { RootLoader } from '~/root'

export default function AppProviders({
  children
}: {
  children: ReactNode
}) {
  const ld = useRouteLoaderData<RootLoader>('root')
  const [config] = useState(() => getConfig(ld?.ENV))
  const [queryClient] = useState(() => new QueryClient())
  const initialState = useMemo(() => cookieToInitialState(config, ld.cookie), [config, ld.cookie])

  return (
    <JotaiProvider store={store}>
      <WagmiProvider config={config} initialState={initialState}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </WagmiProvider>
    </JotaiProvider>
  )
}
