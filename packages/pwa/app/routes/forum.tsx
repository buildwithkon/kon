import { mergeMeta } from '@konxyz/shared/lib/remix'
import { PlusCircle } from '@phosphor-icons/react'
import type { MetaFunction } from '@remix-run/cloudflare'
import BottomBar from '~/components/BottomBar'
import TopBar from '~/components/TopBar'

export const meta: MetaFunction = mergeMeta(({ matches }) => [
  { title: `Forum | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export default function Forum() {
  return (
    <div className="wrapper-app">
      <TopBar backUrl="/home">
        <div className="flex w-full items-center justify-between">
          <span>Forum</span>
          <button type="button">
            <PlusCircle size={38} weight="duotone" />
          </button>
        </div>
      </TopBar>
      <BottomBar />
    </div>
  )
}
