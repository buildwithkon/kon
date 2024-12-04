import type { MetaFunction } from '@remix-run/cloudflare'
import { useRouteLoaderData } from '@remix-run/react'
import BottomBar from '~/components/BottomBar'
import ProfileCard from '~/components/ProfileCard'
import type { RootLoader } from '~/root'
import type { LoaderData } from '~/types'

export const meta: MetaFunction = ({ matches }) => {
  const ld = matches[0]?.data as LoaderData
  return [{ title: `Home | ${ld?.appConfig?.name ?? ''}` }]
}

export default function Home() {
  const ld = useRouteLoaderData<RootLoader>('root')

  return (
    <>
      <div className="wrapper-app-full">
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
