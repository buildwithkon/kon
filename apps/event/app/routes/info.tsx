import BottomBar from '@konxyz/shared-react/components/BottomBar'
// import TopBar from '@konxyz/shared-react/components/TopBar'
import Markdown from '@konxyz/shared-react/components/modules/Markdown'
import { mergeMeta } from '@konxyz/shared/lib/remix'
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
    <div className="wrapper px-6 pb-24">
      {/* <TopBar>Information</TopBar> */}
      <Markdown content={content} />
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
