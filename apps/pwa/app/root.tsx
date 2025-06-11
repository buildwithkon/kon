import AppHandler from '@konxyz/shared-react/components/AppHandler'
import AppProviders from '@konxyz/shared-react/components/AppProviders'
import ClientOnly from '@konxyz/shared-react/components/ClientOnly'
import NotFound from '@konxyz/shared-react/components/NotFound'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useLocation,
  useNavigate,
  useNavigation
} from 'react-router'
import type { Route } from './+types/root'
import './style.css'
import { generateRootMeta, loadAppConfig, resolveEnv } from '@konxyz/shared/lib/app'
import { DEFAULT_FAVICON_URL, getEnsAppConfigBase } from '@konxyz/shared/lib/const'
import { setAppColor, setFontClass } from '@konxyz/shared/lib/style'

export const links: Route.LinksFunction = () => [
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

export const meta = ({ data }: Route.MetaArgs) => generateRootMeta(data?.appConfig)

export const loader = async ({ request, context }: Route.LoaderArgs) => {
  const env = await resolveEnv(context?.cloudflare?.env)
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
      style={setAppColor(ld?.appConfig?.colors)}
      className={setFontClass(ld?.appConfig?.font)}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link
          rel="icon"
          href={ld?.appConfig?.icons?.logo ?? ld?.appConfig?.icons?.logoBgTransparent ?? DEFAULT_FAVICON_URL}
          type="image/png"
        />
        {!(ld?.ENV?.ENV === 'development') && (
          <link
            rel="manifest"
            href={`https://api.${getEnsAppConfigBase(ld?.ENV?.ENV === 'production')}/ens/sepolia/getManigfest/${ld?.appConfig?.id}`}
            type="application/manifest+json"
          />
        )}
        <script
          type="module"
          src="https://cdn.jsdelivr.net/npm/@phosphor-icons/webcomponents@2.1.5/dist/index.mjs"
        />
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
  const ld = useLoaderData()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { location } = useNavigation()
  const isNavigating = Boolean(location)

  return (
    <ClientOnly>
      {() =>
        ld?.appConfig ? (
          <AppProviders ld={ld}>
            <AppHandler ld={ld} navigate={navigate} pathname={pathname} isNavigating={isNavigating} />
            <Outlet />
          </AppProviders>
        ) : (
          <NotFound />
        )
      }
    </ClientOnly>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
