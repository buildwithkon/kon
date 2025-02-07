import type { RootLoader } from '@konxyz/shared/types'
import { PlusCircle } from '@phosphor-icons/react'
import BottomBar from '~/components/BottomBar'
import TopBar from '~/components/TopBar'

export default function Group({ ld }: { ld: RootLoader }) {
  return (
    <div className="wrapper-app">
      <TopBar>
        <div className="flex w-full items-center justify-between">
          <span>Group</span>
          <button type="button">
            <PlusCircle size={38} weight="duotone" />
          </button>
        </div>
      </TopBar>
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
