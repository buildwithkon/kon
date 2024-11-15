import { QRCodeSVG } from 'qrcode.react'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from '~/components/ui/Drawer'
import { COLOR_HEX_DARK, COLOR_HEX_LIGHT } from '~/lib/const'

export default function QrDrawer({ children }: { children: React.ReactNode }) {
  const isDarkMode = false
  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="content pt-8 pb-10">
        <DrawerTitle className="text-center font-bold text-xl">Alice</DrawerTitle>
        <DrawerDescription className="hidden text-center">Scan this QR for checkin!</DrawerDescription>
        <div className="mx-auto px-6 pt-6">
          <QRCodeSVG
            value="https://test.kululu.xyz"
            fgColor={isDarkMode ? COLOR_HEX_LIGHT : COLOR_HEX_DARK}
            bgColor={isDarkMode ? COLOR_HEX_DARK : COLOR_HEX_LIGHT}
            size={168}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
