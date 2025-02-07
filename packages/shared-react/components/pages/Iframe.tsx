import type { RootLoader } from '@konxyz/shared/types'
import BottomBar from '~/components/BottomBar'
import { usePwa } from '@dotmind/react-use-pwa'
import { cn } from '@konxyz/shared/lib/utils'

export default function Iframe({ ld, url }: { ld: RootLoader, url: string }) {
  const { isStandalone } = usePwa()
  const isSlido = url.startsWith('https://app.sli.do')

  return (
    <div className={cn('wrapper-iframe', isStandalone ? 'h-[calc(100vh-5rem)]' : 'h-[calc(100vh-4rem)]')}>
      <iframe
        src={url}
          className={cn('w-full h-full', isStandalone ? 'h-[calc(100vh-5rem)]' : 'h-[calc(100vh-4rem)]')}
        {...(isSlido && { allow: "clipboard-write" })}
        />
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
