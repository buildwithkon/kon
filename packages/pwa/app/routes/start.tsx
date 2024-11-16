import { parseWithZod } from '@conform-to/zod'
import type { ActionFunction, MetaFunction } from '@remix-run/cloudflare'
import { useActionData } from '@remix-run/react'
import { useAtomValue } from 'jotai'
import { loaderDataAtom } from '~/atoms'
import StartForm from '~/components/StartForm'
import { schema } from '~/components/StartForm'
import TopBar from '~/components/TopBar'
import IconKon from '~/components/icon/kon'
import { getSubnameAddress } from '~/lib/ens'

export const meta: MetaFunction = () => {
  const ld = useAtomValue(loaderDataAtom)
  return [{ title: `Sart | ${ld?.appConfig?.name ?? 'KON'}` }]
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  const checkName = await getSubnameAddress(`${submission?.value?.name ?? ''}.demo.kon.eth`)

  if (checkName) {
    return submission.reply({
      formErrors: ['Subname already taken']
    })
  }

  return submission.value
}

export default function Start() {
  const ld = useAtomValue(loaderDataAtom)
  const ad = useActionData()
  console.log('ad:::', ad)

  return (
    <div className="wrapper-app">
      <TopBar>
        <div className="flex w-full justify-center">{ld?.appConfig?.name}</div>
      </TopBar>
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
  )
}
