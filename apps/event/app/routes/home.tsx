import HomePage from '@konxyz/shared-react/components/pages/Home'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useLoaderData, useRouteLoaderData } from 'react-router'
import type { Route } from './+types/home'

export const loader = async ({}: Route.LoaderArgs) => {
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
  const {content} = useLoaderData<typeof loader>()

  return <HomePage ld={ld} content={content} />
}
