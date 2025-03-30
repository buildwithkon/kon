import BottomBar from '@konxyz/shared-react/components/BottomBar'
import TopBar from '@konxyz/shared-react/components/TopBar'
import BuildWith from '@konxyz/shared-react/components/modules/BuildWith'
import Markdown from '@konxyz/shared-react/components/modules/Markdown'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import { useLoaderData, useRouteLoaderData } from 'react-router'
import type { Route } from './+types/misc'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Misc | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export const loader = async (_: Route.LoaderArgs) => {
  const res = await fetch('https://hackmd.io/@yujiym/BkOGAVIt1g/download')
  const content = await res.text()

  return {
    content
  }
}

export default function Misc() {
  const ld = useRouteLoaderData('root')
  const { content } = useLoaderData()

  return (
    <div className={cn('wrapper px-6 pt-16', isStandalone() ? 'pb-22' : 'pb-16')}>
      <TopBar rightBtn="config" backBtn />
      <Markdown content={content} />
      <BuildWith className="py-4" />
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
