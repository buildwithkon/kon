import { HandArrowDown, PlusSquare, UploadSimple } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '~/components/ui/Dialog'

export default function PWAInstallPrompt({ className = '' }: { className?: string }) {
  return (
    <Dialog>
      <DialogTrigger>
        <button type="button" className={className}>
          <HandArrowDown size={28} className="-ml-4 mr-3" />
          Install
        </button>
      </DialogTrigger>
      <DialogContent className="content">
        <DialogTitle className="flex items-center justify-center py-6 font-bold text-2xl">
          <HandArrowDown size={28} className="-ml-4 mr-3" />
          Install
        </DialogTitle>
        <DialogDescription className="px-8 pt-2 pb-4 text-center">
          Install this application on your home screen for quick and easy access when you’re on the go.
        </DialogDescription>
        <ol className="w-full space-y-4 px-8 py-6 pb-10">
          <li className="relative inline-flex w-full items-center justify-center rounded-xl bg-muted py-3 pr-4 pl-12 text-center">
            <span className="absolute left-3 flex h-6 w-6 items-center justify-center text-nowrap rounded-full border-2 border-normal font-bold text-sm">
              1
            </span>
            Tap <UploadSimple size={24} className="mx-2 text-blue-500" /> at Bottom Bar
          </li>
          <li className="relative inline-flex w-full items-center justify-center text-nowrap rounded-xl bg-muted py-3 pr-4 pl-12 text-center">
            <span className="absolute left-3 flex h-6 w-6 items-center justify-center rounded-full border-2 border-normal font-bold text-sm">
              2
            </span>
            Select{' '}
            <span className="ml-2 inline-flex items-center">
              "Add to Home Screen <PlusSquare size={24} className="ml-2" />"
            </span>
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  )
}
