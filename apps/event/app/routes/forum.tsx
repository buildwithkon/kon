import BottomBar from '@konxyz/shared-react/components/BottomBar'
import TopBar from '@konxyz/shared-react/components/TopBar'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useRouteLoaderData } from 'react-router'
import type { Route } from './+types/forum'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Forum | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function Forum() {
  const ld = useRouteLoaderData('root')

  return (
    <div className="wrapper pb-24">
      <TopBar title="Forum" backBtn />
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
