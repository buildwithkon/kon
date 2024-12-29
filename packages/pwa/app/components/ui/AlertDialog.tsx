import { AlertDialog as AlertDialogPrimitive } from '@base-ui-components/react/alert-dialog'
import { cn } from '@konxyz/shared/lib/utils'
import * as React from 'react'

const AlertDialog = AlertDialogPrimitive.Root
AlertDialog.displayName = 'AlertDialog'

const AlertDialogTrigger = AlertDialogPrimitive.Trigger
const AlertDialogPortal = AlertDialogPrimitive.Portal
const AlertDialogPopup = AlertDialogPrimitive.Popup

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    className={cn('text-center font-bold text-xl', className)}
    {...props}
    ref={ref}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description className={cn('text-center text-sm', className)} {...props} ref={ref} />
))
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const AlertDialogBackdrop = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Backdrop>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Backdrop>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Backdrop
    className={cn(
      'data-[closed]:fade-out-0 data-[open]:fade-in-0 fixed inset-0 z-50 bg-gray-500/60 backdrop-blur-sm data-[closed]:animate-out data-[open]:animate-in',
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogBackdrop.displayName = AlertDialogPrimitive.Backdrop.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Popup>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal className="z-50">
    <AlertDialogBackdrop />
    <div className="fixed inset-0 z-50 mx-auto flex max-w-screen-xs items-center justify-center px-6">
      <AlertDialogPopup
        className={cn(
          'content data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 z-50 grid w-full gap-4 rounded-2xl border border-muted pt-6 shadow-2xl duration-200 data-[closed]:animate-out data-[open]:animate-in',
          className
        )}
        {...props}
        ref={ref}
      />
    </div>
  </AlertDialogPortal>
))
AlertDialogContent.displayName = 'AlertDialogContent'

const AlertDialogClose = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Close>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Close
    className={cn('z-50 flex h-12 w-full items-center justify-center font-bold text-sm', className)}
    {...props}
    ref={ref}
  />
))
AlertDialogClose.displayName = AlertDialogPrimitive.Close.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose
}
