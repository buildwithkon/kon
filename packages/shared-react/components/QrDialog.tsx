import { FaviconPng } from '@konxyz/shared/assets'
import { COLOR_HEX_DARK, COLOR_HEX_LIGHT } from '@konxyz/shared/lib/const'
import type { RootLoader } from '@konxyz/shared/types'
import { WalletIcon } from '@phosphor-icons/react'
import { QRCode } from 'react-qrcode-logo'
import { useRouteLoaderData } from 'react-router'
import { useAccount } from 'wagmi'
import AddressInput from '~/components/AddressInput'
import FaceIdIcon from '~/components/svg/FaceId'
import { Dialog, DialogContent, DialogDescription, DialogTrigger } from '~/components/ui/Dialog'
import { useDarkMode } from '~/hooks/useDarkMode'
import { useCurrentConnector } from '~/hooks/useWallet'

export default function QrDialog({ children }: { children: React.ReactNode }) {
  const { address } = useAccount()
  const ld = useRouteLoaderData<RootLoader>('root')
  const { isDark } = useDarkMode()
  const { isSCW } = useCurrentConnector()

  const name = ''
  const id = ''

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
            fgColor={isDark ? COLOR_HEX_LIGHT : COLOR_HEX_DARK}
            bgColor={isDark ? COLOR_HEX_DARK : COLOR_HEX_LIGHT}
            logoImage={ld?.appConfig?.icons?.logo ?? ld?.appConfig?.icons?.logoBgTransparent ?? FaviconPng}
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
            <label htmlFor="address" className="relative flex items-center justify-between">
              <span />
              <span className="font-normal text-muted text-xs">
                {isSCW ? (
                  <div className="flex items-center gap-1">
                    Smart Wallet <FaceIdIcon className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    EOA <WalletIcon size={18} />
                  </div>
                )}
              </span>
            </label>

            <AddressInput />
          </li>
        </ul>
      </DialogContent>
    </Dialog>
  )
}
