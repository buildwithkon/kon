import { usePwa } from '@dotmind/react-use-pwa'
import { cn } from '@konxyz/shared/lib/utils'

export default function Iframe({ url }: { url: string }) {
  const { isStandalone } = usePwa()
  const isSlido = url.startsWith('https://app.sli.do')

  return (
    <div className={cn('wrapper-iframe', isStandalone ? 'h-[calc(100vh-5rem)]' : 'h-[calc(100vh-4rem)]')}>
      <iframe
        src={url}
        className={cn('h-full w-full', isStandalone ? 'h-[calc(100vh-5rem)]' : 'h-[calc(100vh-4rem)]')}
        {...(isSlido && { allow: 'clipboard-write' })}
      />
    </div>
  )
}
