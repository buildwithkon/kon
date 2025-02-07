import MiscPage from '@konxyz/shared-react/components/pages/Misc'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useRouteLoaderData } from 'react-router'
import type { Route } from './+types/home'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Misc | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function Home() {
  const ld = useRouteLoaderData('root')

  return <MiscPage ld={ld} />
}
