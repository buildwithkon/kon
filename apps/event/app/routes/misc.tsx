import BottomBar from '@konxyz/shared-react/components/BottomBar'
import TopBar from '@konxyz/shared-react/components/TopBar'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useRouteLoaderData } from 'react-router'
import type { Route } from './+types/misc'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Misc | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function Home() {
  const ld = useRouteLoaderData('root')

  return (
    <div className="wrapper-app">
      <TopBar title="Misc" rightBtn="config" backBtn />
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
