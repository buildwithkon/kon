import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useLoaderData, useRouteLoaderData } from 'react-router'
import type { Route } from './+types/info'
import Markdown from '@konxyz/shared-react/components/pages/Markdown'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Information | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export const loader = async ({}: Route.LoaderArgs) => {
  const res = await fetch('https://hackmd.io/@yujiym/BJRcrQQK1g/download')
  const content = await res.text()

  return {
    content
  }
}

export default function Info() {
  const ld = useRouteLoaderData('root')
  const { content } = useLoaderData()

  return <Markdown ld={ld} content={content} />
}
