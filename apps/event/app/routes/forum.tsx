import ForumPage from '@konxyz/shared-react/components/pages/Forum'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useRouteLoaderData } from 'react-router'
import type { Route } from './+types/home'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Forum | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function Forum() {
  const ld = useRouteLoaderData('root')

  return <ForumPage ld={ld} />
}
