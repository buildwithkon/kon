import BottomBar from '@konxyz/shared-react/components/BottomBar'
import Iframe from '@konxyz/shared-react/components/modules/Iframe'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useRouteLoaderData } from 'react-router'
import type { Route } from './+types/home'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Q & A | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function QA() {
  const ld = useRouteLoaderData('root')

  return (
    <div className="wrapper">
      <Iframe url="https://app.sli.do/event/hSquYpgsUtoCKLCuEiBrjf" />
      <BottomBar appConfig={ld?.appConfig} />
    </div>
  )
}
