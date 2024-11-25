import { ManifestLink } from '@remix-pwa/sw'
import type { LinksFunction, LoaderFunction } from '@remix-run/cloudflare'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react'
import DefaultFavicon from '~/assets/favicon.png'
import AppHandler from '~/components/AppHandler'
import AppProviders from '~/components/AppProviders'
import { setAppColor, setFontClass } from '~/lib/style'
import { loadAppConfig } from '~/lib/utils'

import type { LoaderData } from '~/types'
import '~/assets/app.css'

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous'
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=DM+Sans:wght@400;700&family=Gelasio:wght@400;700&family=DotGothic16&display=swap'
  }
]

export const loader: LoaderFunction = async ({ request, context }) => {
  console.log('_________', request.url)
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

  return (
    <html
      lang="en"
      style={setAppColor(ld?.appConfig?.colors?.main)}
      className={setFontClass(ld?.appConfig?.font)}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={ld?.appConfig?.icons?.favicon ?? DefaultFavicon} type="image/png" />
        <Meta />
        <ManifestLink />
        <Links />
        <link rel="icon" href={ld?.appConfig?.icons?.favicon ?? DefaultFavicon} type="image/png" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return (
    <AppProviders>
      <AppHandler />
      <Outlet />
    </AppProviders>
  )
}
