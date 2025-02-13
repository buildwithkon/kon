import BottomBar from '@konxyz/shared-react/components/BottomBar'
import TopBar from '@konxyz/shared-react/components/TopBar'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useRouteLoaderData } from 'react-router'
import type { Route } from './+types/forum'
import Avatar from '@konxyz/shared-react/components/Avatar'
import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import { PaperPlaneTilt } from '@phosphor-icons/react'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Forum | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function Forum() {
  const ld = useRouteLoaderData('root')

  return (
    <div className="wrapper">
      <TopBar title="Forum" backBtn />
      <div className={
        cn('bg-gray-400/30 backdrop-blur-xs fixed top-16 left-0 right-0 bottom-16 z-10', isStandalone() ? 'bottom-22' : 'bottom-16'
        )} />
      <Chats />
      <div className="bg-gray-200 px-3 h-16 flex items-center relative">
        <input className='w-full' />
        <PaperPlaneTilt size={32} className="absolute right-6 top-4" />
      </div>
    <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}

const Chats = () => {
  return (
    <div className={cn('pt-22 px-4', isStandalone() ? 'h-[calc(100dvh-9.5rem)]' : 'h-[calc(100dvh-8rem)]')}>
      <div className="flex mb-4 cursor-pointer">
        <div className="w-9 h-9 rounded-full flex items-center justify-center mr-2">
          <Avatar name="#0x00000" />
        </div>
        <div className="flex max-w-96 bg-white rounded-lg p-3 gap-3">
          <p className="text-main">gmgm!</p>
        </div>
      </div>
      <div className="flex justify-end mb-4 cursor-pointer">
        <div className="flex max-w-96 bg-main text-main-fg rounded-lg p-3 gap-3">
          <p>Today is demoday!</p>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center ml-2">
          <Avatar name="#0x000011111" />
        </div>
      </div>
    </div>
  )
}
