import IframePage from '@konxyz/shared-react/components/pages/Iframe'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useRouteLoaderData } from 'react-router'
import type { Route } from './+types/home'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Q & A | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function QA() {
  const ld = useRouteLoaderData('root')

  return <IframePage ld={ld} url="https://app.sli.do/event/hSquYpgsUtoCKLCuEiBrjf" />
}
