import { parseWithZod } from '@conform-to/zod'
import { checkId } from '@konxyz/shared/lib/api'
import { genRanStr } from '@konxyz/shared/lib/utils'
import { createRegistarSchema } from '@konxyz/shared/schema/registar'
import type { LoaderData } from '@konxyz/shared/types'
import type { ActionFunctionArgs, LoaderFunction, MetaFunction } from '@remix-run/cloudflare'
import { useActionData, useLoaderData, useRouteLoaderData } from '@remix-run/react'
import ProfileCard from '~/components/ProfileCard'
import RegistarForm from '~/components/RegistarForm'
import type { RootLoader } from '~/root'

export const meta: MetaFunction = ({ matches }) => {
  const ld = matches[0]?.data as LoaderData
  return [{ title: `Start | ${ld?.appConfig?.name ?? ''}` }]
}

export const loader: LoaderFunction = () => ({
  str1: genRanStr(),
  str2: genRanStr(10)
})

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const submission = await parseWithZod(formData, {
    schema: createRegistarSchema({
      async isIdUnique(id: string) {
        const res = await checkId(id)
        return res
      }
    }),
    async: true
  })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  // const checkId = await getSubnameAddress(
  //   ld.ENV,
  //   `${submission.value.id}.${ld.subdomain}.${ENS_APPCONFIG_NAME}`
  // )

  console.log('--------submission::', submission.value, '--------checkId::', checkId)

  // check alredy exists
  if (checkId) {
    return submission.reply({
      formErrors: ['ID already exists']
    })
  }

  // if (chainId !== baseSepolia.id) {
  //   await switchChain({ chainId: baseSepolia.id })
  // }

  // try {
  //   const res = await writeContractAsync({
  //     abi,
  //     address: REGISTAR_ADDRESS,
  //     functionName: 'register',
  //     args: [normalize(data.id), address as `0x${string}`]
  //   })
  //   console.log('res:::', res)
  // } catch (error: any) {
  //   console.log(error)
  // }

  return Response.json({
    success: true
  })
}

export default function Start() {
  const ld = useRouteLoaderData<RootLoader>('root')
  const { str1, str2 } = useLoaderData<typeof loader>()
  const lastResult = useActionData()

  return (
    <div className="wrapper-app-full">
      <ProfileCard qr={false} point={str1} name={str2} />
      <p className="px-4 pt-6 pb-8 text-xl">{ld?.appConfig?.description}</p>
      <p className="text-center text-xl">⬇️</p>
      <h1 className="pt-10 pb-6 text-center font-bold text-2xl">👋&nbsp;Join “{ld?.appConfig?.name}”</h1>
      <RegistarForm lastResult={lastResult} />
    </div>
  )
}
