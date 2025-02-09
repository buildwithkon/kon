import BottomBar from '@konxyz/shared-react/components/BottomBar'
import TopBar from '@konxyz/shared-react/components/TopBar'
import Markdown from '@konxyz/shared-react/components/modules/Markdown'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useLoaderData, useRouteLoaderData } from 'react-router'
import type { Route } from './+types/misc'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Misc | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export const loader = async ({}: Route.LoaderArgs) => {
  const res = await fetch('https://hackmd.io/@yujiym/BkOGAVIt1g/download')
  const content = await res.text()

  return {
    content
  }
}

export default function Home() {
  const ld = useRouteLoaderData('root')
  const { content } = useLoaderData()

  return (
    <div className="wrapper px-6 py-16">
      <TopBar title="" rightBtn="config" backBtn />
      <Markdown content={content} />
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
