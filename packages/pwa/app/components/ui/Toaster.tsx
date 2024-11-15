import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-stone-900 group-[.toaster]:text-lg group-[.toaster]:text-main-fg group-[.toaster]:shadow-2xl',
          description: 'group-[.toast]:text-main-fg',
          actionButton: 'group-[.toast]:bg-main',
          cancelButton: 'group-[.toast]:bg-main'
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
