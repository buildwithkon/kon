import { isStandalone } from '@konxyz/shared/lib/utils'
import type { AppConfig } from '@konxyz/shared/types'
import { HandTapIcon } from '@phosphor-icons/react'
import PWAInstallPrompt from '~/components/PWAInstallPrompt'
import BuildWith from '~/components/modules/BuildWith'
import IconKon from '~/components/svg/kon'
import { useLogin } from '~/hooks/useWallet'

export default function TopPage({ appConfig }: { appConfig: AppConfig }) {
  const { loginAsync } = useLogin()

  const login = async () => {
    try {
      await loginAsync()
    } catch (error) {
      console.log('login error:', error)
    }
  }

  return (
    <div className="min-h-dvh bg-main text-main-fg">
      <div className="wrapper flex min-h-dvh flex-col items-center justify-center">
        <div className="grid w-full flex-1 place-items-center p-6 text-center">
          <div className="grid gap-6">
            {(appConfig?.icons?.logoBgTransparent ?? appConfig?.icons?.logo) ? (
              <img
                src={appConfig?.icons?.logoBgTransparent ?? appConfig?.icons?.logo}
                className="mx-auto mb-10 max-h-48 max-w-48"
                alt={appConfig?.name ?? ''}
              />
            ) : (
              <IconKon size={198} className="mb-8" />
            )}
            <h1 className="font-bold text-5xl text-accent">{appConfig?.name ?? 'KON'}</h1>
            {appConfig?.description && <p className="text-2xl">{appConfig?.description}</p>}
          </div>
        </div>
        <footer className="w-full p-6">
          {process.env.NODE_ENV === 'development' || isStandalone() ? (
            <button type="button" onClick={login} className="btn-main-fg w-full text-xl">
              <HandTapIcon size={28} className="-ml-4 mr-3" />
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
