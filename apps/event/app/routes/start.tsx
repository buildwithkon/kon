import RegisterForm, { submittion } from '@konxyz/shared-react/components/RegisterForm'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useRouteLoaderData } from 'react-router'
import type { Route } from './+types/start'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Start | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData()
  const res = await submittion(formData, request.url, context?.cloudflare?.env as Env)
  console.log('action, formData:', formData, 'submittion:', res)

  if (res.status !== 'success') {
    return {
      result: res.reply(),
      showConfirm: false
    }
  }
  return {
    result: res.reply(),
    showConfirm: true
  }
}

export default function Start() {
  const ld = useRouteLoaderData('root')
  const lastResult = ld?.lastResult

  return (
    <div className="wrapper p-6">
      <RegisterForm appConfig={ld?.appConfig} lastResult={lastResult}>
        <p className="px-4 pt-6 pb-8 text-xl">{ld?.appConfig?.description}</p>
        <p className="text-center text-xl">⬇️</p>
        <h1 className="pt-10 pb-6 text-center font-bold text-2xl">👋&nbsp;Join “{ld?.appConfig?.name}”</h1>
      </RegisterForm>
    </div>
  )
}
