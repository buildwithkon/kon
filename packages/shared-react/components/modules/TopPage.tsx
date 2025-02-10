import { isStandalone } from '@konxyz/shared/lib/utils'
import type { AppConfig } from '@konxyz/shared/types'
import { HandTap } from '@phosphor-icons/react'
import PWAInstallPrompt from '~/components/PWAInstallPrompt'
import IconKon from '~/components/icon/kon'
import BuildWith from '~/components/modules/BuildWith'
import { useWagmi } from '~/hooks/useWagmi'

export default function TopPage({ appConfig }: { appConfig: AppConfig }) {
  const { loginAsync } = useWagmi()

  const login = async () => {
    try {
      await loginAsync()
    } catch (error) {
      console.log('login error:', error)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-main text-main-fg">
      <div className="wrapper">
        <div className="-mt-40 flex flex-col items-center justify-center space-y-8 text-center">
          {appConfig?.icons?.logo ? (
            <img
              src={appConfig?.icons?.logo}
              className="mb-8 max-h-48 max-w-48 rounded-full"
              alt={appConfig?.name ?? ''}
            />
          ) : (
            <IconKon size={198} className="mb-8" />
          )}
          <h1 className="font-bold text-6xl text-accent">{appConfig?.name ?? 'KON'}</h1>
          {appConfig?.description && <p className="text-2xl">{appConfig?.description}</p>}
        </div>
        <footer className="fixed right-0 bottom-0 left-0 mx-auto max-w-screen-xs px-6 py-6">
          {process.env.NODE_ENV === 'development' || isStandalone() ? (
            <button type="button" onClick={login} className="btn-main-fg w-full text-xl">
              <HandTap size={28} className="-ml-4 mr-3" />
              Start
            </button>
          ) : (
            <PWAInstallPrompt className="btn-main-fg w-full text-xl" />
          )}
          <BuildWith />
        </footer>
      </div>
    </div>
  )
}
