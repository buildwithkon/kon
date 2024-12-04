import type { MetaFunction } from '@remix-run/cloudflare'
import { useRouteLoaderData } from '@remix-run/react'
import ProfileCard from '~/components/ProfileCard'
import StartForm from '~/components/StartForm'
import type { RootLoader } from '~/root'
import type { LoaderData } from '~/types'

export const meta: MetaFunction = ({ matches }) => {
  const ld = matches[0]?.data as LoaderData
  return [{ title: `Start | ${ld?.appConfig?.name ?? ''}` }]
}

export default function Start() {
  const ld = useRouteLoaderData<RootLoader>('root')

  return (
    <div className="wrapper-app-full">
      <ProfileCard qr={false} />
      <p className="px-4 pt-6 pb-10 text-xl">{ld?.appConfig?.description}</p>
      <hr />
      <h1 className="-mx-1 pt-10 pb-6 text-center font-bold text-2xl">👋 Join “{ld?.appConfig?.name}”</h1>
      <StartForm />
    </div>
  )
}
