import { shortAddr } from '@konxyz/shared/lib/utils'
import { Check, ClipboardText, GearSix, SignOut, X } from '@phosphor-icons/react'
import { useNavigate } from '@remix-run/react'
import { toast } from 'sonner'
import { useAccount, useDisconnect } from 'wagmi'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/ui/AlertDialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from '~/components/ui/Drawer'

export default function Config() {
  const { address } = useAccount()
  const { disconnectAsync } = useDisconnect()
  const navigate = useNavigate()

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
    <Drawer>
      <DrawerTrigger asChild>
        <button type="button">
          <GearSix size={32} weight="duotone" />
        </button>
      </DrawerTrigger>
      <DrawerContent className="content px-6 pt-8 pb-10">
        <DrawerTitle className="flex items-center justify-center text-center font-bold text-xl">
          <GearSix size={24} weight="bold" className="-mt-0.5 -ml-2 mr-1.5" />
          Config
        </DrawerTitle>
        <DrawerDescription className="hidden text-center">User Config</DrawerDescription>
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
        <AlertDialog>
          <AlertDialogTrigger>
            <button type="button" className="btn-main mt-8 w-full">
              <SignOut size={32} className="-ml-3 mr-2" /> Logout
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure to Logout?</AlertDialogTitle>
              <AlertDialogDescription className="hidden">Are you sure to Logout?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-muted">
                <X weight="bold" className="mr-1.5" />
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={logout} className="text-blue-600">
                <Check weight="bold" className="mr-1.5 text-blue-400" />
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DrawerContent>
    </Drawer>
  )
}
