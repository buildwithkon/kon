import { cn } from '@konxyz/shared/lib/utils'
import type { AppConfig } from '@konxyz/shared/types'
import LoginDialog from '~/components/LoginDialog'
import BuildWith from '~/components/modules/BuildWith'
import IconKon from '~/components/svg/kon'

export default function TopPage({ appConfig }: { appConfig: AppConfig }) {
  return (
    <div className="min-h-dvh bg-main text-main-fg">
      <div className="wrapper flex min-h-dvh flex-col items-center justify-center">
        <div className="grid w-full flex-1 place-items-center p-6 text-center">
          <div className="grid gap-6">
            {(appConfig?.icons?.logoBgTransparent ?? appConfig?.icons?.logo) ? (
              <img
                src={appConfig?.icons?.logoBgTransparent ?? appConfig?.icons?.logo}
                className={cn(
                  'mx-auto mb-10 max-h-48 max-w-48',
                  appConfig?.icons?.logoBgTransparent ? 'rounded-xl' : 'rounded-full'
                )}
                alt={appConfig?.name ?? ''}
              />
            ) : (
              <IconKon size={198} className="mb-8" />
            )}
            <h1 className="font-bold text-5xl text-accent">{appConfig?.name ?? 'KON'}</h1>
            {appConfig?.description && (
              <p className="whitespace-pre-wrap text-2xl">{appConfig?.description}</p>
            )}
          </div>
        </div>
        <footer className="w-full p-6">
          <LoginDialog name={appConfig?.name ?? 'KON'} />
          <BuildWith />
        </footer>
      </div>
    </div>
  )
}
