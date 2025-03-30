import BottomBar from '@konxyz/shared-react/components/BottomBar'
import TopBar from '@konxyz/shared-react/components/TopBar'
import Markdown from '@konxyz/shared-react/components/modules/Markdown'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import { useLoaderData, useRouteLoaderData } from 'react-router'
import type { Route } from './+types/info'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Information | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export const loader = async ({}: Route.LoaderArgs) => {
  const res = await fetch('https://hackmd.io/58Pt6mAvTjCrXiNsMpmAZw/download')
  const content = await res.text()

  return {
    content
  }
}

export default function Info() {
  const ld = useRouteLoaderData('root')
  const { content } = useLoaderData()

  return (
    <div className={cn('wrapper pt-16', isStandalone() ? 'pb-22' : 'pb-16')}>
      <TopBar title="Information" backBtn />
      <Markdown content={content} className="px-6" />
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
