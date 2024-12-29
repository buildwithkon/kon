import { shortAddr } from '@konxyz/shared/lib/utils'
import { Check, ClipboardText, GearSix, X } from '@phosphor-icons/react'
import { SignOut } from '@phosphor-icons/react'
import { useNavigate } from '@remix-run/react'
import * as React from 'react'
import { toast } from 'sonner'
import { useAccount, useDisconnect } from 'wagmi'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/ui/AlertDialog'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '~/components/ui/Dialog'

export default function ConfigDialog() {
  const { address } = useAccount()
  const { disconnectAsync } = useDisconnect()
  const navigate = useNavigate()
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const okRef = React.useRef<HTMLButtonElement>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const logout = async () => {
    await disconnectAsync()
    navigate('/')
  }

  const copy = (address: `0x${string}` | undefined) => {
    if (!address) return
    navigator.clipboard.writeText(address)
    toast.success('Copied to clipboard!')
  }

  return (
    <Dialog>
      <DialogTrigger>
        <GearSix size={32} weight="duotone" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="flex items-center justify-center text-center font-bold text-xl">
          <GearSix size={24} weight="bold" className="-mt-0.5 -ml-2 mr-1.5" />
          Config
        </DialogTitle>
        <DialogDescription className="hidden text-center">User Config</DialogDescription>
        <ul className="mt-4 space-y-4">
          {/* <li>
            <label htmlFor="theme">Theme</label>
            <ThemeSelect />
          </li> */}
          <li>
            <label htmlFor="address">Address</label>
            <div className="relative">
              <input
                type="text"
                value={shortAddr(address as string, 14, 5)}
                readOnly
                className="w-full overflow-ellipsis pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => copy(address)}
                className="absolute top-2 right-2 backdrop-blur-sm"
              >
                <ClipboardText size={30} weight="duotone" className="" />
              </button>
            </div>
          </li>
        </ul>
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger
            className="btn-main mt-8 w-full"
            ref={triggerRef}
            onClick={() => setDialogOpen(true)}
          >
            <SignOut size={32} className="-ml-3 mr-2" /> Logout
          </AlertDialogTrigger>
          <AlertDialogContent className="z-50" initialFocus={okRef} finalFocus={triggerRef}>
            <AlertDialogTitle className="inline-flex items-center justify-center">
              <SignOut size={24} weight="bold" className="-ml-3 mr-2" /> Logout
            </AlertDialogTitle>
            <AlertDialogDescription className="pb-3">Are you sure to Logout?</AlertDialogDescription>
            <div className="grid w-full grid-cols-2 border-muted border-t">
              <AlertDialogClose type="button" ref={okRef} className="border-muted border-r">
                <X weight="bold" className="mr-1.5" />
                Cancel
              </AlertDialogClose>
              <AlertDialogClose type="button" className=" text-blue-600" onClick={() => logout()}>
                <Check weight="bold" className="mr-1.5 text-blue-400" />
                OK
              </AlertDialogClose>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  )
}
