import { OnchainKitProvider } from '@coinbase/onchainkit'
import { useRouteLoaderData } from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { type ReactNode, useState } from 'react'
import { type State, WagmiProvider } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { store } from '~/atoms'
import Loading from '~/components/Loading'
import { getConfig } from '~/lib/wagmi'

export default function AppProviders(props: {
  children: ReactNode
  initialState?: State
}) {
  const ld = useRouteLoaderData('root')
  const [config] = useState(() => getConfig(ld?.ENV))
  const [queryClient] = useState(() => new QueryClient())

  return (
    <JotaiProvider store={store}>
      <WagmiProvider config={config} initialState={props.initialState}>
        <QueryClientProvider client={queryClient}>
          <OnchainKitProvider apiKey={ld?.ENV?.COINBASE_CLIENT_API_KEY} chain={baseSepolia ?? base}>
            <>
              {props.children}
              <Loading />
            </>
          </OnchainKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </JotaiProvider>
  )
}
