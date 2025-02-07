import type { RootLoader } from '@konxyz/shared/types'
import BottomBar from '~/components/BottomBar'
import ConfigDialog from '~/components/ConfigDialog'
import TopBar from '~/components/TopBar'

export default function Misc({ ld }: { ld: RootLoader }) {
  return (
    <div className="wrapper-app">
      <TopBar>
        <div className="flex w-full items-center justify-between">
          <span>Misc</span>
          <ConfigDialog />
        </div>
      </TopBar>
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
