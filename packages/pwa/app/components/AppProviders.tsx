import { useRouteLoaderData } from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { type ReactNode, useState } from 'react'
import { type State, WagmiProvider } from 'wagmi'
import { store } from '~/atoms'
import { getConfig } from '~/lib/wagmi'
import type { RootLoader } from '~/root'

export default function AppProviders(props: {
  children: ReactNode
  initialState?: State
}) {
  const ld = useRouteLoaderData<RootLoader>('root')
  const [config] = useState(() => getConfig(ld?.ENV))
  const [queryClient] = useState(() => new QueryClient())

  return (
    <JotaiProvider store={store}>
      <WagmiProvider config={config} initialState={props.initialState}>
        <QueryClientProvider client={queryClient}>{props.children}</QueryClientProvider>
      </WagmiProvider>
    </JotaiProvider>
  )
}
