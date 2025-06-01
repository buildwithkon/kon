import BottomBar from '@konxyz/shared-react/components/BottomBar'
import NotFound from '@konxyz/shared-react/components/NotFound'
import TopBar from '@konxyz/shared-react/components/TopBar'
import Forum from '@konxyz/shared-react/components/modules/Forum'
import Iframe from '@konxyz/shared-react/components/modules/Iframe'
import Markdown from '@konxyz/shared-react/components/modules/Markdown'
import ProfileCard from '@konxyz/shared-react/components/modules/ProfileCard'
import { loadAppConfig } from '@konxyz/shared/lib/app'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import { useLoaderData } from 'react-router'
import type { Route } from './+types/page'

export const meta = mergeMeta(({ data }: Route.MetaArgs) => [
  {
    title: `${data?.tabData?.title ?? 'Not Found'} | ${data?.appConfig?.name ?? ''}`
  }
])

export const loader = async ({ context, request }: Route.LoaderArgs) => {
  const env = context?.cloudflare?.env as Env
  const { appConfig } = await loadAppConfig(request.url, env)
  const path = new URL(request?.url)?.pathname.replace(/^\//, '')
  const tabs = appConfig?.template?.tabs ?? []
  const { tabData, isFirstTab, isLastTab } = (() => {
    const index = tabs.findIndex((item) => item.id === path)
    return {
      tabData: index !== -1 ? tabs[index] : undefined,
      isFirstTab: index === 0 && index !== -1,
      isLastTab: index === tabs.length - 1 && index !== -1
    }
  })()

  const [_, contentType, contentBody] = tabData?.content.match(/^([^:]+):(.+)$/)

  let content = null
  if (contentType === 'md') {
    const res = await fetch(contentBody)
    content = await res.text()
  }
  if (contentType === 'iframe') {
    content = contentBody
  }

  return {
    appConfig,
    tabData,
    isFirstTab,
    isLastTab,
    contentType,
    content
  }
}

export default function Page() {
  const { tabData, content, appConfig, isFirstTab, isLastTab, contentType } = useLoaderData()

  if (!tabData) return <NotFound />

  const showHeader = contentType !== 'iframe' && !isFirstTab

  return (
    <div
      className={cn(
        'wrapper',
        contentType === 'iframe'
          ? 'px-0 pt-0'
          : contentType === 'xmtp'
            ? 'px-0 pt-16'
            : isFirstTab
              ? 'px-6 pt-6'
              : 'px-6 pt-16',
        isStandalone() ? 'pb-22' : 'pb-16'
      )}
    >
      {showHeader && <TopBar title={tabData?.title ?? ''} rightBtn={isLastTab && 'config'} backBtn />}
      {isFirstTab && <ProfileCard appConfig={appConfig} name="" id="" isSticky showQr />}
      {contentType === 'md' && <Markdown content={content} />}
      {contentType === 'iframe' && <Iframe url={content} />}
      {contentType === 'xmtp' && <Forum />}
      <BottomBar appConfig={appConfig} />
    </div>
  )
}
