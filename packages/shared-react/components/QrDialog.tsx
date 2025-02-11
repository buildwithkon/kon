import { FaviconPng } from '@konxyz/shared/assets'
import { COLOR_HEX_DARK, COLOR_HEX_LIGHT } from '@konxyz/shared/lib/const'
import type { RootLoader } from '@konxyz/shared/types'
import { QRCode } from 'react-qrcode-logo'
import { useRouteLoaderData } from 'react-router'
import { useAccount } from 'wagmi'
import AddressInput from '~/components/AddressInput'
import { Dialog, DialogContent, DialogDescription, DialogTrigger } from '~/components/ui/Dialog'
import { useDarkMode } from '~/hooks/useDarkMode'

export default function QrDialog({ children }: { children: React.ReactNode }) {
  const { address } = useAccount()
  const ld = useRouteLoaderData<RootLoader>('root')
  const isDarkMode = useDarkMode()

  const name = 'My Name'
  const id = 'mytestid'

  return (
    <Dialog>
      <DialogTrigger>{children}</DialogTrigger>
      <DialogContent className="content pt-8 pb-10">
        {/* <DialogTitle className="text-center font-bold text-xl">Alice</DialogTitle> */}
        <DialogDescription className="hidden text-center">Scan this QR for checkin!</DialogDescription>
        <div className="mx-auto px-6">
          <QRCode
            value={`https://${ld?.subdomain}.kon.xyz/users/address/${address ?? ''}`}
            size={256}
            ecLevel="Q"
            fgColor={isDarkMode ? COLOR_HEX_LIGHT : COLOR_HEX_DARK}
            bgColor={isDarkMode ? COLOR_HEX_DARK : COLOR_HEX_LIGHT}
            logoImage={ld?.appConfig?.icons?.favicon ?? ld?.appConfig?.icons?.logo ?? FaviconPng}
            qrStyle="dots"
            logoPadding={1}
            logoPaddingStyle="square"
            removeQrCodeBehindLogo
            eyeRadius={{
              outer: 8,
              inner: 0.5
            }}
          />
        </div>
        <ul className="space-y-4 pt-5">
          <li className="text-center font-bold text-lg">
            {name ? (
              <span>
                {name} {id && <span className="font-normal text-base opacity-90">({id})</span>}
              </span>
            ) : id ? (
              id
            ) : (
              'Your Name'
            )}
          </li>
          <li>
            <AddressInput />
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  )
}
