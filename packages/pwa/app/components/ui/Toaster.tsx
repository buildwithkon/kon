import { CheckCircle, Info, Warning, WarningCircle } from '@phosphor-icons/react'
import { Toaster as Sonner, toast } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:content group-[.toaster]:text-lg group-[.toaster]:shadow-2xl',
          description: 'group-[.toast]:content',
          actionButton: 'group-[.toast]:bg-main',
          cancelButton: 'group-[.toast]:bg-main'
        }
      }}
      {...props}
      position="top-center"
      icons={{
        success: <CheckCircle weight="duotone" className="text-teal-600/50" size={24} />,
        info: <Info weight="duotone" className="text-stone-600/50" size={24} />,
        warning: <Warning weight="duotone" className="text-yellow-600/50" size={24} />,
        error: <WarningCircle weight="duotone" className="text-red-600/50" size={24} />
      }}
    />
  )
}

export { Toaster, toast }
