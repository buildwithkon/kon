import type { MetaFunction } from '@remix-run/cloudflare'

export const meta: MetaFunction = () => [
  { title: 'KON Dashboard' },
  { name: 'description', content: 'KON Dashboard' }
]

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center">
      <p>DASHBORD</p>
    </div>
  )
}
