import { Toast } from '@base-ui-components/react/toast'
import { XIcon } from '@phosphor-icons/react'

export default function CsutomToast({ children }: { children?: React.ReactNode }) {
  const toastManager = Toast.createToastManager()

  return (
    <Toast.Provider toastManager={toastManager}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="fixed top-22 right-0 bottom-auto left-0 z-50 mx-auto flex w-full max-w-[320px]">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

function ToastList() {
  const { toasts } = Toast.useToastManager()
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className="content absolute right-0 bottom-0 left-auto z-[calc(1000-var(--toast-index))] mr-0 w-full select-none rounded-lg border border-muted bg-clip-padding p-4 shadow-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] [transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)+calc(var(--toast-index)*-15px)))_scale(calc(1-(var(--toast-index)*0.1)))] [transition-property:opacity,transform] after:absolute after:bottom-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-[''] data-[ending-style]:opacity-0 data-[limited]:opacity-0 dark:shadow-white/5 data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-[expanded]:[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y)))] data-[expanded]:data-[ending-style]:data-[swipe-direction=down]:[transform:translateY(calc(var(--toast-swipe-movement-y)+150%))] data-[expanded]:data-[ending-style]:data-[swipe-direction=left]:[transform:translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=right]:[transform:translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))] data-[expanded]:data-[ending-style]:data-[swipe-direction=up]:[transform:translateY(calc(var(--toast-swipe-movement-y)-150%))] data-[starting-style]:[transform:translateY(150%)] data-[ending-style]:[&:not([data-limited])]:[transform:translateY(150%)]"
      style={{
        ['--gap' as string]: '1rem',
        ['--offset-y' as string]:
          'calc(var(--toast-offset-y) * -1 + (var(--toast-index) * var(--gap) * -1) + var(--toast-swipe-movement-y))'
      }}
    >
      {toast?.title && <Toast.Title className="font-medium leading-5" />}
      {toast?.description && <Toast.Description className="pt-1 text-sm leading-5" />}
      <Toast.Close
        className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded border-none"
        aria-label="Close"
      >
        <XIcon className="h-4 w-4 text-muted" />
      </Toast.Close>
    </Toast.Root>
  ))
}
