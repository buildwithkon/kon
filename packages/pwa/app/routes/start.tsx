import { parseWithZod } from '@conform-to/zod'
import type { ActionFunctionArgs, LoaderFunction, MetaFunction } from '@remix-run/cloudflare'
import { useLoaderData, useRouteLoaderData } from '@remix-run/react'
import ProfileCard from '~/components/ProfileCard'
import RegistarForm from '~/components/RegistarForm'
import { FormSchema } from '~/components/RegistarForm'
import { genRanStr } from '~/lib/utils'
import type { RootLoader } from '~/root'
import type { LoaderData } from '~/types'

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
  const submission = parseWithZod(formData, { schema: FormSchema })

  if (submission.status !== 'success') {
    return submission.reply()
  }

  console.log(
    '-------2',
    context,
    `${new URL(request.url).origin}/ens/sepolia/getSubnameAddress/${submission.value.id}`
  )
  const res = await context.cloudflare.env.API_WORKER.fetch(
    `${new URL(request.url).origin}/ens/sepolia/getSubnameAddress/${submission.value.id}`
  ).then((res) => res.json())

  console.log('-------3')
  const checkId = JSON.parse(res)
  console.log('-------4')

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

  return (
    <div className="wrapper-app-full">
      <ProfileCard qr={false} point={str1} name={str2} />
      <p className="px-4 pt-6 pb-8 text-xl">{ld?.appConfig?.description}</p>
      <p className="text-center text-xl">⬇️</p>
      <h1 className="pt-10 pb-6 text-center font-bold text-2xl">👋&nbsp;Join “{ld?.appConfig?.name}”</h1>
      <RegistarForm />
    </div>
  )
}
