import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import { PaperPlaneTilt } from '@phosphor-icons/react'
import Avatar from '~/components/Avatar'

export default function Forum() {
  return (
    <>
      <div
        className={cn(
          '-mt-16 fixed top-16 right-0 bottom-16 left-0 z-10 bg-gray-400/30 backdrop-blur-xs',
          isStandalone() ? 'bottom-22' : 'bottom-16'
        )}
      />
      <Chats />
      <div className="relative flex h-16 items-center bg-gray-200 px-3 dark:bg-gray-800">
        <input className="w-full" />
        <PaperPlaneTilt size={32} className="absolute top-4 right-6" />
      </div>
    </>
  )
}

const Chats = () => {
  return (
    <div className={cn('px-4 pt-22', isStandalone() ? 'h-[calc(100dvh-9.5rem)]' : 'h-[calc(100dvh-8rem)]')}>
      <div className="mb-4 flex cursor-pointer">
        <div className="mr-2 flex h-9 w-9 items-center justify-center rounded-full">
          <Avatar name="#0x00000" />
        </div>
        <div className="flex max-w-96 gap-3 rounded-lg bg-white p-3">
          <p className="text-main">gmgm!</p>
        </div>
      </div>
      <div className="mb-4 flex cursor-pointer justify-end">
        <div className="flex max-w-96 gap-3 rounded-lg bg-main p-3 text-main-fg">
          <p>Today is demoday!</p>
        </div>
        <div className="ml-2 flex h-9 w-9 items-center justify-center rounded-full">
          <Avatar name="#0x000011111" />
        </div>
      </div>
    </div>
  )
}
