import { LogoPng } from '@konxyz/shared/assets'
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
            value={`https://${ld.subdomain}.kon.xyz/users/address/${address ?? ''}`}
            size={256}
            ecLevel="Q"
            fgColor={isDarkMode ? COLOR_HEX_LIGHT : COLOR_HEX_DARK}
            bgColor={isDarkMode ? COLOR_HEX_DARK : COLOR_HEX_LIGHT}
            logoImage={ld?.appConfig?.icons?.logo ?? LogoPng}
            qrStyle="dots"
            logoPadding={2}
            logoPaddingStyle="square"
            removeQrCodeBehindLogo
            eyeRadius={{
              outer: 10,
              inner: 6
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
