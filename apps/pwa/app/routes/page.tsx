import BottomBar from '@konxyz/shared-react/components/BottomBar'
import IcalConfigDialog from '@konxyz/shared-react/components/IcalConfigDialog'
import NotFound from '@konxyz/shared-react/components/NotFound'
import TopBar from '@konxyz/shared-react/components/TopBar'
import Forum from '@konxyz/shared-react/components/modules/Forum'
import Ical from '@konxyz/shared-react/components/modules/Ical'
import Iframe from '@konxyz/shared-react/components/modules/Iframe'
import Markdown from '@konxyz/shared-react/components/modules/Markdown'
import ProfileCard from '@konxyz/shared-react/components/modules/ProfileCard'
import Rewards from '@konxyz/shared-react/components/modules/Rewards'
import { loadAppConfig } from '@konxyz/shared/lib/app'
import { getIcalData } from '@konxyz/shared/lib/ical'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { cn, isStandalone } from '@konxyz/shared/lib/utils'
import { DotsThreeVerticalIcon } from '@phosphor-icons/react'
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

  let content = undefined

  const [_, contentType, contentBody] = tabData?.content.match(/^([^:]+):(.+)$/) || []

  if (contentType === 'md') {
    const res = await fetch(contentBody)
    content = await res.text()
  }
  if (contentType === 'iframe') {
    content = contentBody
  }
  if (contentType === 'ical') {
    try {
      const icalData = await getIcalData(contentBody, request.url, env)
      content = {
        url: contentBody,
        ical: icalData
      }
    } catch (error) {
      console.error('Failed to fetch iCal data in loader:', error)
    }
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
          : contentType === 'xmtp' || contentType === 'ical'
            ? 'px-0 pt-16'
            : isFirstTab
              ? 'px-6 pt-6'
              : 'px-6 pt-16',
        isStandalone() ? 'pb-22' : 'pb-16'
      )}
    >
      {showHeader && (
        <TopBar
          title={tabData?.title ?? ''}
          rightBtn={
            isLastTab ? (
              'config'
            ) : contentType === 'xmtp' ? (
              'xmtp'
            ) : contentType === 'ical' ? (
              <IcalConfigDialog icalUrl={content?.url}>
                <DotsThreeVerticalIcon size={32} weight="bold" />
              </IcalConfigDialog>
            ) : undefined
          }
        />
      )}
      {isFirstTab && <ProfileCard appConfig={appConfig} isSticky showQr />}
      {isFirstTab && !contentType && (
        <div className="flex flex-col gap-6 py-6">
          <p className="whitespace-pre-wrap px-1">{appConfig?.description}</p>
          <Rewards appConfig={appConfig} />
        </div>
      )}
      {contentType === 'ical' && <Ical url={content?.url} data={content?.ical} />}
      {contentType === 'md' && <Markdown content={content} />}
      {contentType === 'iframe' && <Iframe url={content} />}
      {contentType === 'xmtp' && <Forum />}
      <BottomBar appConfig={appConfig} />
    </div>
  )
}
