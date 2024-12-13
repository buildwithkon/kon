import { useSWEffect } from '@remix-pwa/sw'
import type { LinksFunction, LoaderFunction } from '@remix-run/cloudflare'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react'
import DefaultFavicon from '~/assets/favicon.png'
import { loadAppConfig } from '~/lib/api'
import { setAppColor, setFontClass } from '~/lib/style'
import '~/assets/app.css'
import AppHandler from '~/components/AppHandler'
import AppProviders from '~/components/AppProviders'
import NotFound from '~/components/NotFound'
import type { Env } from '~/types'
import '~/assets/app.css'
import { StrictMode } from 'react'

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
  const config = await loadAppConfig(request.url, context.cloudflare.env as Env)

  return {
    ...config,
    ENV: {
      ...context.cloudflare.env
    }
  }
}

export type RootLoader = typeof loader

export function Layout({ children }: { children: React.ReactNode }) {
  const ld = useLoaderData<RootLoader>()

  return (
    <html
      lang="en"
      style={setAppColor(ld?.appConfig?.colors?.main)}
      className={setFontClass(ld?.appConfig?.font)}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href={ld?.appConfig?.icons?.favicon ?? DefaultFavicon} type="image/png" />
        <Meta />
        <Links />
        <link rel="icon" href={ld?.appConfig?.icons?.favicon ?? DefaultFavicon} type="image/png" />
        <link rel="manifest" id="manifest" />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const ld = useLoaderData<RootLoader>()
  useSWEffect()

  if (!ld.appConfig) {
    return <NotFound />
  }

  return process.env.NODE_ENV === 'development' ? (
    <StrictMode>
      <AppContent />
    </StrictMode>
  ) : (
    <AppContent />
  )
}

const AppContent = () => (
  <AppProviders>
    <AppHandler />
    <Outlet />
  </AppProviders>
)
