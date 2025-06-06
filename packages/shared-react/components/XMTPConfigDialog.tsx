import {
  CheckIcon,
  DotsThreeVerticalIcon,
  GearSixIcon,
  SignInIcon,
  SignOutIcon,
  WalletIcon,
  XIcon
} from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import AddressInput from '~/components/AddressInput'
import FaceIdIcon from '~/components/svg/FaceId'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/ui/AlertDialog'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '~/components/ui/Dialog'
import { useCurrentConnector } from '~/hooks/useWallet'
import { useXMTP } from '~/hooks/useXMTP'

export default function XMTPConfigDialog() {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const okRef = useRef<HTMLButtonElement>(null)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const { isSCW } = useCurrentConnector()
  const { client, disconnect } = useXMTP()

  const logout = async () => {
    await disconnect()
  }

  return (
    <Dialog>
      <DialogTrigger>
        <DotsThreeVerticalIcon size={32} weight="bold" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="flex items-center justify-center text-center font-bold text-xl">
          <GearSixIcon size={24} weight="bold" className="-mt-0.5 -ml-2 mr-1.5" />
          XMTP
        </DialogTitle>
        <DialogDescription className="hidden text-center">XMTP Config</DialogDescription>
        <ul className="mt-4 space-y-4">
          <li>
            <label htmlFor="address" className="relative flex items-center justify-between">
              <span>Wallet</span>
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
        {client ? (
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger
              className="btn-main mt-8 w-full"
              ref={triggerRef}
              onClick={() => setDialogOpen(true)}
            >
              <SignOutIcon size={32} className="-ml-3 mr-2" /> Disconnect
            </AlertDialogTrigger>
            <AlertDialogContent className="z-50" initialFocus={okRef} finalFocus={triggerRef}>
              <AlertDialogTitle className="inline-flex items-center justify-center">
                <SignOutIcon size={24} weight="bold" className="-ml-3 mr-2" /> Disconnect
              </AlertDialogTitle>
              <AlertDialogDescription className="pb-3">
                Are you sure to disconnect from XMTP?
              </AlertDialogDescription>
              <div className="grid w-full grid-cols-2 border-muted border-t">
                <AlertDialogClose type="button" ref={okRef} className="border-muted border-r">
                  <XIcon weight="bold" className="mr-1.5" />
                  Cancel
                </AlertDialogClose>
                <AlertDialogClose type="button" className=" text-blue-600" onClick={() => logout()}>
                  <CheckIcon weight="bold" className="mr-1.5 text-blue-400" />
                  OK
                </AlertDialogClose>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <button type="button" className="btn-main mt-8 w-full">
            <SignInIcon size={32} className="-ml-3 mr-2" /> Connect
          </button>
        )}
      </DialogContent>
    </Dialog>
  )
}
