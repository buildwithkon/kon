import { CheckIcon, GearSixIcon, SignOutIcon, WalletIcon, XIcon } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useDisconnect } from 'wagmi'
import AddressInput from '~/components/AddressInput'
import ThemeChanger from '~/components/ThemeChanger'
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

export default function ConfigDialog() {
  const { disconnectAsync } = useDisconnect()
  const navigate = useNavigate()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const okRef = useRef<HTMLButtonElement>(null)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const { isSCW } = useCurrentConnector()

  const logout = async () => {
    await disconnectAsync()
    navigate('/')
  }

  return (
    <Dialog>
      <DialogTrigger>
        <GearSixIcon size={32} weight="duotone" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="flex items-center justify-center text-center font-bold text-xl">
          <GearSixIcon size={24} weight="bold" className="-mt-0.5 -ml-2 mr-1.5" />
          Config
        </DialogTitle>
        <DialogDescription className="hidden text-center">User Config</DialogDescription>
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
          <li>
            <label htmlFor="theme">Theme</label>
            <div className="px-2 pt-1.5">
              <ThemeChanger />
            </div>
          </li>
        </ul>
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger
            className="btn-main mt-8 w-full"
            ref={triggerRef}
            onClick={() => setDialogOpen(true)}
          >
            <SignOutIcon size={32} className="-ml-3 mr-2" /> Logout
          </AlertDialogTrigger>
          <AlertDialogContent className="z-50" initialFocus={okRef} finalFocus={triggerRef}>
            <AlertDialogTitle className="inline-flex items-center justify-center">
              <SignOutIcon size={24} weight="bold" className="-ml-3 mr-2" /> Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="pb-3">Are you sure to Logout?</AlertDialogDescription>
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
      </DialogContent>
    </Dialog>
  )
}
