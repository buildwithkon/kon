import { COLOR_HEX_DARK, COLOR_HEX_LIGHT } from '@konxyz/shared/lib/const'
import { useRouteLoaderData } from '@remix-run/react'
import { QRCodeSVG } from 'qrcode.react'
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
          <QRCodeSVG
            value={address ?? ''}
            fgColor={isDarkMode ? COLOR_HEX_LIGHT : COLOR_HEX_DARK}
            bgColor={isDarkMode ? COLOR_HEX_DARK : COLOR_HEX_LIGHT}
            size={168}
            imageSettings={{
              src: ld?.appConfig?.icons?.logo,
              x: undefined,
              y: undefined,
              height: 36,
              width: 36,
              opacity: 1,
              excavate: true
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
