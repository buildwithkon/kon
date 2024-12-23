import type { LoaderData } from '@konxyz/shared/types'
import type { MetaFunction } from '@remix-run/cloudflare'
import TopBar from '~/components/TopBar'

export const meta: MetaFunction = ({ matches }) => {
  const ld = matches[0]?.data as LoaderData
  return [{ title: `Admin | ${ld?.appConfig?.name ?? ''}` }]
}

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
