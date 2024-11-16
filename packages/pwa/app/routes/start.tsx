import { parseWithZod } from '@conform-to/zod'
import type { MetaFunction } from '@remix-run/cloudflare'
import { type ActionFunctionArgs, json, redirect } from '@remix-run/cloudflare'
import { useAtomValue } from 'jotai'
import { loaderDataAtom } from '~/atoms'
import StartForm from '~/components/StartForm'
import TopBar from '~/components/TopBar'
import IconKon from '~/components/icon/kon'

export const meta: MetaFunction = () => {
  const ld = useAtomValue(loaderDataAtom)
  return [{ title: `Sart | ${ld?.appConfig?.name ?? 'KON'}` }]
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema })

  if (submission.status !== 'success') {
    return json({
      success: false,
      message: 'error!',
      submission: submission.reply()
    })
  }

  // 入力値が問題なければデータベースのデータを使った検証を行うサンプル
  if (await submission.value.name) {
    return json({
      success: false,
      message: 'error!',
      submission: submission.reply({
        fieldErrors: {
          name: ['This name cannot be used']
        }
      })
    })
  }

  return redirect('/home')
}

export default function Start() {
  const ld = useAtomValue(loaderDataAtom)

  return (
    <div className="wrapper-app">
      <TopBar>
        <div className="flex w-full justify-center">{ld?.appConfig?.name}</div>
      </TopBar>
      <div className="wrapper-app">
        <div className="flex items-center justify-center">
          {ld?.appConfig?.icons?.logo ? (
            <img
              src={ld?.appConfig?.icons?.logo}
              className="mb-8 max-h-48 max-w-48 rounded-full"
              alt={ld?.appConfig?.name ?? ''}
            />
          ) : (
            <IconKon size={198} className="mb-8" />
          )}
        </div>
        <StartForm />
      </div>
    </div>
  )
}
