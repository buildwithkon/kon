import type { MetaFunction } from '@remix-run/cloudflare'
import BottomBar from '~/components/BottomBar'
import ConfigDrawer from '~/components/ConfigDrawer'
import TopBar from '~/components/TopBar'
import type { RootLoaderData } from '~/types'

export const meta: MetaFunction = ({ matches }) => {
  const ld = matches[0]?.data as RootLoaderData
  return [{ title: `Misc | ${ld?.appConfig?.name ?? ''}` }]
}

export default function Misc() {
  return (
    <div className="wrapper-app">
      <TopBar backUrl="/home">
        <div className="flex w-full items-center justify-between">
          <span>Misc</span>
          <ConfigDrawer />
        </div>
      </TopBar>
      <BottomBar />
    </div>
  )
}
