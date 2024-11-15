import type { MetaFunction } from '@remix-run/cloudflare'
import { useAtomValue } from 'jotai'
import { loaderDataAtom } from '~/atoms'
import BottomBar from '~/components/BottomBar'
import ProfileCard from '~/components/ProfileCard'
import TopBar from '~/components/TopBar'

export const meta: MetaFunction = () => {
  const ld = useAtomValue(loaderDataAtom)
  return [{ title: `Home | ${ld?.appConfig?.name ?? 'KON'}` }]
}

export default function Home() {
  const ld = useAtomValue(loaderDataAtom)

  return (
    <>
      <TopBar>
        <div className="flex w-full justify-center">{ld?.appConfig?.name}</div>
      </TopBar>
      <div className="wrapper-app">
        <ProfileCard />
        <Badges />
        <BottomBar />
      </div>
    </>
  )
}

const BADGES = ['🤠 Explorer', '🎨 Designer', '🌟 VIP', '📝 Creator']

const Badges = () => (
  <ul className="my-10">
    {BADGES.map((badge) => (
      <li
        key={badge}
        className="mr-2.5 mb-2 inline-flex items-center justify-center rounded-2xl border-2 border-muted px-4 py-2 font-bold text-lg"
      >
        {badge}
      </li>
    ))}
  </ul>
)
