import BottomBar from '@konxyz/shared-react/components/BottomBar'
import ProfileCard from '@konxyz/shared-react/components/ProfileCard'
import { useRouteLoaderData } from 'react-router'

// export const meta = mergeMeta(({ matches }: Route.MetaFunctionArgs) => [
//   { title: `Home | ${matches[0]?.data?.appConfig?.name ?? ''}` }
// ])

export default function Home() {
  const ld = useRouteLoaderData('root')

  return (
    <>
      <div className="wrapper-app-full">
        <ProfileCard point={1000} name="▯◇◹◸◿▿" id="xxx" />
        <Badges />
        <BottomBar />
      </div>
    </>
  )
}

const BADGES = ['🤠 Standard plan']

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
