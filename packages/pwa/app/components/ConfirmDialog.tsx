import {} from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '~/components/ui/Dialog'

type Props = {
  open: boolean
  children: React.ReactNode
  initialFocus?: React.RefObject<HTMLElement>
  finalFocus?: React.RefObject<HTMLElement>
  title?: string | JSX.Element
  description?: string | JSX.Element
}

export default function ConfirmDialog({
  open,
  children,
  initialFocus,
  finalFocus,
  title,
  description
}: Props) {
  return (
    <Dialog open={open}>
      <DialogContent className="content pt-8 pb-10" initialFocus={initialFocus} finalFocus={finalFocus}>
        {/* <DialogClose
          className="sm:-top-3 sm:-right-3 absolute top-2 right-2"
        >
          <X className="flex h-8 w-8 items-center justify-center rounded-full bg-main p-1 text-main-fg opacity-80 hover:opacity-100" />
        </DialogClose> */}
        {title && <DialogTitle className="text-center font-bold text-xl">{title}</DialogTitle>}
        {description && <DialogDescription className="py-4 text-center">{description}</DialogDescription>}
        {children}
      </DialogContent>
    </Dialog>
  )
}
