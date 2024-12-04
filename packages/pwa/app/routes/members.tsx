import { MagnifyingGlass } from '@phosphor-icons/react'
import { ChatCircle, HandCoins } from '@phosphor-icons/react'
import type { MetaFunction } from '@remix-run/cloudflare'
import { useRouteLoaderData } from '@remix-run/react'
import Avatar from '~/components/Avatar'
import BottomBar from '~/components/BottomBar'
import TopBar from '~/components/TopBar'

export const meta: MetaFunction = ({ matches }) => {
  const ld = matches[0]?.data as RootLoader
  return [{ title: `Members | ${ld?.appConfig?.name ?? ''}` }]
}

const DummyList = [
  { id: 'john', pt: 100, address: '0x1C4e3C31623F12d8f0C17b75e53C186B991FF33B' },
  { id: 'alice', pt: 10, address: '0xcccc' },
  { id: 'yoda', pt: 9, address: '0xcccc' }
]

export default function Members() {
  return (
    <div className="wrapper-app">
      <TopBar backUrl="/home">Members</TopBar>
      <div className="relative">
        <input type="search" className="mb-8 w-full rounded-full pr-4 pl-14" />
        <MagnifyingGlass size={28} className="absolute top-2.5 left-4" />
      </div>
      <UserLists />
      <BottomBar />
    </div>
  )
}

const UserLists = () => {
  const ld = useRouteLoaderData('root')

  return (
    <div className="-mx-6">
      <ul className="w-full border-muted border-b">
        {DummyList.map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between overflow-hidden border-muted border-t px-6 py-4"
          >
            <div className="flex items-center overflow-hidden">
              <Avatar name={user.id} size={48} />
              <div>
                <p className="px-4 font-bold text-xl">{user.id}</p>
                <p className="px-4 font-mono text-sm">
                  {user.pt}
                  <span className="px-0.5">pts</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 overflow-hidden">
              <a
                href={`converse://group?groupId=${ld?.appConfig?.plugins?.xmtp}&text=@tip ${user.address} 10`}
              >
                <HandCoins size={28} />
              </a>
              <a href={`converse://dm?peer=${user.address}`}>
                <ChatCircle size={28} />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
