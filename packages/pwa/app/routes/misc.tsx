import { mergeMeta } from '@konxyz/shared/lib/remix'
import type { MetaFunction } from '@remix-run/cloudflare'
import BottomBar from '~/components/BottomBar'
import ConfigDialog from '~/components/ConfigDialog'
import TopBar from '~/components/TopBar'

export const meta: MetaFunction = mergeMeta(({ matches }) => [
  { title: `Misc | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function Misc() {
  return (
    <div className="wrapper-app">
      <TopBar backUrl="/home">
        <div className="flex w-full items-center justify-between">
          <span>Misc</span>
          <ConfigDialog />
        </div>
      </TopBar>
      <BottomBar />
    </div>
  )
}
