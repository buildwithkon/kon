import { useSWEffect } from '@remix-pwa/sw'
import type { LinksFunction, LoaderFunction } from '@remix-run/cloudflare'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react'
import DefaultFavicon from '~/assets/favicon.png'
import { setAppColor, setFontClass } from '~/lib/style'
import { loadAppConfig } from '~/lib/utils'
import '~/assets/app.css'
import AppHandler from '~/components/AppHandler'
import AppProviders from '~/components/AppProviders'
import NotFound from '~/components/NotFound'
import type { Env } from '~/types'
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
  const config = await loadAppConfig(request.url, context.cloudflare.env as Env)

  return {
    ...config,
    ENV: {
      ...context.cloudflare.env
    }
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  useSWEffect()
  const ld = useLoaderData<typeof loader>()

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
        <link rel="manifest" id="manifest" />
        <Links />
        <link rel="icon" href={ld?.appConfig?.icons?.favicon ?? DefaultFavicon} type="image/png" />
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
  const ld = useLoaderData<LoaderData>()

  if (!ld.appConfig) {
    return <NotFound />
  }

  return (
    <AppProviders>
      <AppHandler />
      <Outlet />
    </AppProviders>
  )
}
