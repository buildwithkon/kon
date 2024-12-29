import { COLOR_HEX_DARK, COLOR_HEX_LIGHT } from '@konxyz/shared/lib/const'
import { useRouteLoaderData } from '@remix-run/react'
import { QRCodeSVG } from 'qrcode.react'
import { useAccount } from 'wagmi'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from '~/components/ui/Drawer'

export default function QrDrawer({ children }: { children: React.ReactNode }) {
  const { address } = useAccount()
  const ld = useRouteLoaderData('root')
  const isDarkMode = false

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="content pt-8 pb-10">
        <DrawerTitle className="text-center font-bold text-xl">Alice</DrawerTitle>
        <DrawerDescription className="hidden text-center">Scan this QR for checkin!</DrawerDescription>
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
      </DrawerContent>
    </Drawer>
  )
}
