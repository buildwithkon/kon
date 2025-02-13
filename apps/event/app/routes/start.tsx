import { submittion } from '@konxyz/shared-react/components/RegisterForm'
import RegisterForm, { RegisterConfirmDialog } from '@konxyz/shared-react/components/RegisterForm'
import { mergeMeta } from '@konxyz/shared/lib/remix'
import { useEffect, useState } from 'react'
import { useActionData, useRouteLoaderData } from 'react-router'
import type { Route } from './+types/start'

export const meta = mergeMeta(({ matches }: Route.MetaArgs) => [
  { title: `Start | ${matches[0]?.data?.appConfig?.name ?? ''}` }
])

export const action = async ({ request, context }: Route.ActionArgs) => {
  const formData = await request.formData()
  const res = await submittion(formData, request.url, context?.cloudflare?.env as Env)
  console.log(res)

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
  const data = useActionData()
  const ld = useRouteLoaderData('root')

  const joinTitle = `👋 Join ${ld?.appConfig?.name}`
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)

  useEffect(() => {
    if (data?.showConfirm) {
      setConfirmOpen(true)
    }
  }, [data?.showConfirm])

  return (
    <div className="wrapper p-6">
      <RegisterForm appConfig={ld?.appConfig} lastResult={data?.result}>
        <p className="px-4 pt-6 pb-8 text-xl">{ld?.appConfig?.description}</p>
        <p className="text-center text-xl">⬇️</p>
        <h1 className="pt-10 pb-6 text-center font-bold text-2xl">{joinTitle}</h1>
        <RegisterConfirmDialog
          joinTitle={joinTitle}
          confirmOpen={confirmOpen}
          setConfirmOpen={setConfirmOpen}
        />
      </RegisterForm>
    </div>
  )
}
