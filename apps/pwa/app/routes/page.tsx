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

  let content: string | undefined | { url: string; ical: any } | undefined
  let contentType: string | undefined

  if (typeof tabData?.content === 'string') {
    const [_, type, body] = tabData.content.match(/^([^:]+):(.+)$/) || []
    contentType = type
    if (type === 'md') {
      const res = await fetch(body)
      content = await res.text()
    }
    if (type === 'iframe') {
      content = body
    }
    if (type === 'xmtp') {
      content = body
    }
    if (type === 'ical') {
      try {
        // Support multiple URLs separated by commas in string content
        const urls = body
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)

        // Optional date range from tab options (compact YYYYMMDDHHmm)
        const opt = (tabData as any)?.options
        const parseCompact = (v?: string) => {
          if (!v) return undefined
          const m = v.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/)
          if (!m) return undefined
          const [, Y, M, D, h, mnt] = m
          return new Date(Date.UTC(Number(Y), Number(M) - 1, Number(D), Number(h), Number(mnt)))
        }
        const icalData = await getIcalData(urls, request.url, env, {
          startDate: parseCompact(opt?.startDate),
          endDate: parseCompact(opt?.endDate)
        })
        content = { url: urls[0] || '', ical: icalData }
      } catch (error) {
        console.error('Failed to fetch iCal data in loader:', error)
      }
    }
  } else if (tabData?.content && typeof tabData.content === 'object') {
    // Advanced object content configuration
    const c: any = tabData.content
    contentType = c.type
    if (c.type === 'ical') {
      const urls: string[] = Array.isArray(c.urls) ? c.urls : c.url ? [c.url] : []
      try {
        const icalData = await getIcalData(urls, request.url, env, {
          startDate: c.startDate,
          endDate: c.endDate
        })
        content = { url: urls[0] || '', ical: icalData }
      } catch (error) {
        console.error('Failed to fetch iCal data in loader:', error)
      }
    }
    if (c.type === 'xmtp') {
      // Support optional invite slug to render a join link
      try {
        const slug = c.options?.inviteSlug as string | undefined
        if (slug) {
          const res = (await apiClient(new URL(request.url).origin, env).xmtp.invites[':slug'].$get({
            param: { slug }
          })) as Response
          if (res.ok) {
            const invite = await res.json()
            // Reuse `tabData.content` body as conversationId if present
            content = c.conversationId || ''
            ;(content as any).inviteUrl = invite.url
          }
        }
      } catch (e) {
        console.error('Failed to load XMTP invite details:', e)
      }
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
      {contentType === 'xmtp' && (
        <Forum
          conversationId={typeof content === 'string' ? content : (content as any)?.conversationId || ''}
          inviteUrl={typeof content === 'object' ? (content as any)?.inviteUrl : undefined}
        />
      )}
      <BottomBar appConfig={appConfig} />
    </div>
  )
}
