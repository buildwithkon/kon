import { Dialog as DialogPrimitive } from '@base-ui-components/react/dialog'
import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import React from 'react'

const Dialog = ({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) => (
  <DialogPrimitive.Root {...props} />
)
Dialog.displayName = 'Dialog'

const DialogTrigger = DialogPrimitive.Trigger
const DialogPopup = DialogPrimitive.Popup
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogBackdrop = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Backdrop>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Backdrop
    ref={ref}
    className={cn('fixed inset-0 z-40 bg-gray-500/60 backdrop-blur-sm', className)}
    {...props}
  />
))
DialogBackdrop.displayName = DialogPrimitive.Backdrop.displayName

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title className={cn('text-center font-bold text-xl', className)} {...props} ref={ref} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description className={cn('text-center text-sm', className)} {...props} ref={ref} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>
>(({ className, ...props }, ref) => (
  <DialogPortal>
    <DialogBackdrop />
    <div className="fixed inset-0 z-50 mx-auto flex max-w-screen-xs items-center justify-center px-6">
      <DialogPopup
        className={cn(
          'data-[closed]:slide-out-to-bottom content data-[open]:slide-in-to-top fixed inset-x-0 bottom-0 z-40 mx-auto flex h-auto max-w-screen-xs flex-col rounded-t-2xl px-6 py-8 duration-200 data-[closed]:animate-out data-[open]:animate-in',
          isStandalone() ? 'pt-8 pb-12' : 'py-8',
          className
        )}
        {...props}
        ref={ref}
      />
    </div>
  </DialogPortal>
))
DialogContent.displayName = 'DialogContent'

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogBackdrop,
  DialogContent,
  DialogPopup,
  DialogTitle,
  DialogDescription
}
