import { usePwa } from '@dotmind/react-use-pwa'
import { SITE_URL } from '@konxyz/shared/lib/const'
import { HandTap } from '@phosphor-icons/react'
import { useRouteLoaderData } from '@remix-run/react'
import { useConnect } from 'wagmi'
import PWAInstallPrompt from '~/components/PWAInstallPrompt'
import IconKon from '~/components/icon/kon'
import type { RootLoader } from '~/root'

export const meta: MetaFunction = ({ matches }) => {
  const ld = matches[0]?.data as LoaderData
  return [{ title: `${ld?.appConfig?.name ?? 'Build with KON'}` }]
}

export default function Top() {
  const { connectors, connectAsync } = useConnect()
  const { isStandalone } = usePwa()
  const ld = useRouteLoaderData<RootLoader>('root')

  const login = async () => {
    try {
      await connectAsync({ connector: connectors[0] })
    } catch (error) {
      console.log('login error:', error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-main text-main-fg">
      <div className="wrapper">
        <div className="-mt-32 flex flex-col items-center justify-center space-y-8 text-center">
          {ld?.appConfig?.icons?.logo ? (
            <img
              src={ld?.appConfig?.icons?.logo}
              className="mb-8 max-h-48 max-w-48 rounded-full"
              alt={ld?.appConfig?.name ?? ''}
            />
          ) : (
            <IconKon size={198} className="mb-8" />
          )}
          <h1 className="font-bold text-6xl">{ld?.appConfig?.name ?? 'Kon community'}</h1>
          {ld?.appConfig?.description && <p className="text-2xl">{ld?.appConfig?.description}</p>}
        </div>
        <footer className="fixed right-0 bottom-0 left-0 mx-auto max-w-screen-xs px-6 py-6">
          {process.env.NODE_ENV === 'development' || isStandalone ? (
            <button type="button" onClick={login} className="btn-main w-full bg-main-fg text-main text-xl">
              <HandTap size={28} className="-ml-4 mr-3" />
              Start
            </button>
          ) : (
            <PWAInstallPrompt className="btn-main w-full bg-main-fg text-main text-xl" />
          )}
          <BuildWith />
        </footer>
      </div>
    </div>
  )
}

const BuildWith = () => (
  <div className="mt-6 text-center font-mono text-sm">
    <a href={SITE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center">
      Build with <IconKon size={28} className="-mt-0.5 ml-1" /> <strong>KON</strong>
    </a>
  </div>
)
