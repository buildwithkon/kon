import type { MetaFunction } from '@remix-run/cloudflare'
import TopBar from '~/components/TopBar'

import { mergeMeta } from '@konxyz/shared/lib/remix'

export const meta: MetaFunction = mergeMeta(({ matches }) => [
  { title: `Admin | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function Admin() {
  return (
    <div className="wrapper-app">
      <TopBar>
        <div className="flex w-full items-center justify-between">
          <span>Admin</span>
        </div>
      </TopBar>
    </div>
  )
}
