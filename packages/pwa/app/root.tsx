import { FaviconPng } from '@konxyz/shared/assets'
import { loadAppConfig } from '@konxyz/shared/lib/api'
import { setAppColor, setFontClass } from '@konxyz/shared/lib/style'
import { useSWEffect } from '@remix-pwa/sw'
import type { LinksFunction, LoaderFunction } from '@remix-run/cloudflare'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react'
import '~/assets/pwa.css'
import AppHandler from '~/components/AppHandler'
import AppProviders from '~/components/AppProviders'
import NotFound from '~/components/NotFound'

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous'
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=DotGothic16&Mona+Sans:wght@400;700&family=Source+Serif+4:wght@400;700&family=Space+Mono:wght@400;700&display=swap'
  }
]

export const loader: LoaderFunction = async ({ request, context }) => {
  const env = context?.cloudflare?.env as Env
  const config = await loadAppConfig(request.url, env)
  const cookie = request.headers.get('cookie')

  return {
    ...config,
    cookie,
    ENV: {
      ...env
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
        <link rel="icon" href={ld?.appConfig?.icons?.favicon ?? FaviconPng} type="image/png" />
        <Meta />
        <Links />
        <link rel="icon" href={ld?.appConfig?.icons?.favicon ?? FaviconPng} type="image/png" />
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

  return <AppContent />
}

const AppContent = () => (
  <AppProviders>
    <AppHandler />
    <Outlet />
  </AppProviders>
)
