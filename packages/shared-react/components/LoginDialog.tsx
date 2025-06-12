import { cn } from '@konxyz/shared/lib/utils'
import { getMobileOS, isStandalone } from '@konxyz/shared/lib/utils'
import {
  CompassIcon,
  DeviceMobileIcon,
  DotsThreeCircleVerticalIcon,
  HandArrowDownIcon,
  PlusSquareIcon,
  SignInIcon,
  UploadSimpleIcon
} from '@phosphor-icons/react'
import FaceIdIcon from '~/components/svg/FaceId'
import WalletConnectIcon from '~/components/svg/WalletConnect'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '~/components/ui/Dialog'
import { useLogin } from '~/hooks/useWallet'

export default function LoginDialog({ name, className = '' }: { name: string; className?: string }) {
  const { loginAsync } = useLogin()
  const platform = getMobileOS()

  const PWA_STEPS = {
    ios: [
      {
        icon: <CompassIcon size={24} className="text-blue-500" />,
        text: '1) Open your main browser'
      },
      {
        icon: <UploadSimpleIcon size={24} className="text-blue-500" />,
        text: '2) Press Share in Navigation bar'
      },
      {
        icon: <PlusSquareIcon size={24} />,
        text: '3) Scroll down to "Add to Home Screen"'
      }
    ],
    android: [
      {
        icon: <DotsThreeCircleVerticalIcon size={24} className="text-muted" />,
        text: '1) Open your browser menu'
      },
      {
        icon: <DeviceMobileIcon size={24} className="text-muted" />,
        text: '2) Tap "Add to Home screen"'
      }
    ]
  }

  const getPwasteps = () => (platform === 'android' ? PWA_STEPS.android : PWA_STEPS.ios)

  const login = async (connectorId = 'coinbaseWalletSDK') => {
    try {
      await loginAsync(connectorId)
    } catch (error) {
      console.log('login error:', error)
    }
  }

  return (
    <Dialog>
      <DialogTrigger className={cn('btn-main-fg w-full', className)}>
        <HandArrowDownIcon size={28} className="-ml-4 mr-3" />
        Start
      </DialogTrigger>
      <DialogContent className="content pb-8">
        {!isStandalone() && (
          <>
            <DialogTitle className="flex items-center justify-center pb-4 font-bold text-2xl">
              <HandArrowDownIcon size={28} className="-ml-5 mr-3" />
              Install App
            </DialogTitle>
            <DialogDescription className="px-6">
              Installing this app as a PWA gives you the most advanced features.
            </DialogDescription>
            <ol className="w-full space-y-3 py-4 pt-6 text-sm">
              {getPwasteps().map((item, i) => (
                <li
                  key={`pwa-step-${String(i)}`}
                  className="relative inline-flex w-full items-center justify-start rounded-xl bg-muted py-2 pr-2 pl-4 text-left"
                >
                  <span className="mr-4">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ol>
            <div className="relative my-10 border-muted border-t-2 text-center">
              <span className="content -top-2.5 absolute right-1/2 w-20 translate-x-10 font-bold text-muted text-sm">
                OR
              </span>
            </div>
          </>
        )}
        <DialogTitle className="flex items-center justify-center pb-6 font-bold text-2xl">
          <SignInIcon size={28} className="-ml-5 mr-3" />
          Login
        </DialogTitle>
        <div className="flex flex-col gap-4">
          <button
            type="button"
            className="btn-main justify-start! w-full gap-4 px-6!"
            onClick={() => login('coinbaseWalletSDK')}
          >
            <FaceIdIcon className="h-7 w-7" />
            Smart Wallet
          </button>
          <button
            type="button"
            className="btn-main justify-start! w-full gap-4 px-6!"
            onClick={() => login('injected')}
          >
            <CompassIcon size={28} />
            Browser Wallet
          </button>
          <button
            type="button"
            className="btn-main justify-start! w-full gap-4 px-6!"
            onClick={() => login('walletConnect')}
          >
            <WalletConnectIcon className="h-7 w-7" />
            WalletConnect
          </button>
        </div>
        <p className="px-2 pt-4 text-sm">A wallet with Basenames or ENS is recommended.</p>
      </DialogContent>
    </Dialog>
  )
}
