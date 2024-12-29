import { COLOR_HEX_DARK, COLOR_HEX_LIGHT } from '@konxyz/shared/lib/const'
import { useRouteLoaderData } from '@remix-run/react'
import { QRCode } from 'react-qrcode-logo'
import { useAccount } from 'wagmi'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '~/components/ui/Dialog'

export default function QrDialog({ children }: { children: React.ReactNode }) {
  const { address } = useAccount()
  const ld = useRouteLoaderData('root')
  const isDarkMode = false

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="content pt-8 pb-10">
        <DialogTitle className="text-center font-bold text-xl">Alice</DialogTitle>
        <DialogDescription className="hidden text-center">Scan this QR for checkin!</DialogDescription>
        <div className="mx-auto px-6 pt-6">
          <QRCode
            value={address ?? ''}
            size={168}
            fgColor={isDarkMode ? COLOR_HEX_LIGHT : COLOR_HEX_DARK}
            bgColor={isDarkMode ? COLOR_HEX_DARK : COLOR_HEX_LIGHT}
            logoImage={ld?.appConfig?.icons?.logo}
            qrStyle="dots"
            logoPadding={4}
            logoPaddingStyle="square"
            removeQrCodeBehindLogo
            eyeRadius={{
              outer: 14,
              inner: 10
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
