import { ManifestLink } from '@remix-pwa/sw'
import type { LoaderFunction } from '@remix-run/cloudflare'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useMatches } from '@remix-run/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import '~/assets/app.css'
import DefaultFavicon from '~/assets/favicon.png'
import Loader from '~/components/Loader'
import { setAppColor, setFontClass } from '~/lib/style'
import { loadAppConfig } from '~/lib/utils'
import { config } from '~/lib/wagmi'
import type { LoaderData } from '~/types'

export const loader: LoaderFunction = async ({ request, context }) => {
  const config = await loadAppConfig(request.url)
  return {
    ...config,
    ENV: {
      ...context.cloudflare.env
    }
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const ld = useLoaderData<LoaderData>()
  const matches = useMatches()
  const bodyClass = matches.find((match) => match.data?.bodyClass)?.data?.bodyClass || 'default'

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={setAppColor(ld?.appConfig?.colors?.main)}
      className={setFontClass(ld?.appConfig?.font)}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=DM+Sans:wght@400;700&family=Gelasio:wght@400;700&family=DotGothic16&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href={ld?.appConfig?.icons?.favicon ?? DefaultFavicon} type="image/png" />
        <Meta />
        <ManifestLink />
        <Links />
        <link rel="icon" href={ld?.appConfig?.icons?.favicon ?? DefaultFavicon} type="image/png" />
      </head>
      <body className={bodyClass}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

const queryClient = new QueryClient()

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Loader />
      </QueryClientProvider>
    </WagmiProvider>
  )
}
