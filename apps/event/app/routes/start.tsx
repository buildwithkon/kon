import RegisterForm, { submittion } from '@konxyz/shared-react/components/RegisterForm'
import ProfileCard from '@konxyz/shared-react/components/modules/ProfileCard'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useRouteLoaderData } from 'react-router'
import type { Route } from './+types/start'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Start | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData()
  console.log('formData:', formData)
  const submission = await submittion(formData)

  if (submission.status !== 'success') {
    return submission.reply()
  }
  console.log('--------submission::', submission.value)
}

export default function Home() {
  const ld = useRouteLoaderData('root')
  const lastResult = ld?.lastResult

  return (
    <div className="wrapper p-6">
      <ProfileCard appConfig={ld?.appConfig} name="▯◇◹◸◿▿" id="xxx" />
      <p className="px-4 pt-6 pb-8 text-xl">{ld?.appConfig?.description}</p>
      <p className="text-center text-xl">⬇️</p>
      <h1 className="pt-10 pb-6 text-center font-bold text-2xl">👋&nbsp;Join “{ld?.appConfig?.name}”</h1>
      <RegisterForm lastResult={lastResult} />
    </div>
  )
}
