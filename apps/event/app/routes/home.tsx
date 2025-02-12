import BottomBar from '@konxyz/shared-react/components/BottomBar'
import Markdown from '@konxyz/shared-react/components/modules/Markdown'
import ProfileCard from '@konxyz/shared-react/components/modules/ProfileCard'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import { useLoaderData, useRouteLoaderData } from 'react-router'
import type { Route } from './+types/home'

export const loader = async (_: Route.LoaderArgs) => {
  const res = await fetch('https://hackmd.io/@yujiym/BJRcrQQK1g/download')
  const content = await res.text()

  return {
    content
  }
}

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Home | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function Home() {
  const ld = useRouteLoaderData('root')
  const { content } = useLoaderData<typeof loader>()

  return (
    <div className={cn('wrapper px-6 pt-6', isStandalone() ? 'pb-22' : 'pb-16')}>
      <ProfileCard appConfig={ld?.appConfig} name="Your Name" isSticky showQr />
      <Markdown content={content} />
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
