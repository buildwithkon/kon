import { zodResolver } from '@hookform/resolvers/zod'
import { useRouteLoaderData } from '@remix-run/react'
import { useForm } from 'react-hook-form'
import { baseSepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { useAccount, useChainId, useSwitchChain, useWriteContract } from 'wagmi'
import { z } from 'zod'
import CustomTransaction from '~/components/CustomTransaction'
import { abi } from '~/lib/abis/L2Registar'
import { ENS_APPCONFIG_NAME, REGISTAR_ADDRESS } from '~/lib/const'
import { getSubnameAddress } from '~/lib/ens'
import type { RootLoader } from '~/root'

const FormSchema = z.object({
  id: z
    .string()
    .min(3, { message: 'Id must be at least 3 characters long.' })
    .max(255, { message: 'Id cannot exceed 255 characters.' })
    .regex(/^[a-z0-9-]+$/, { message: 'Id can only contain lowercase letters, numbers, and hyphens.' })
    .refine((name) => !name.startsWith('-') && !name.endsWith('-'), {
      message: 'Id cannot start or end with a hyphen.'
    }),
  name: z.string().max(255, { message: 'Display Name cannot exceed 255 characters.' })
})
type FormSchemaType = z.infer<typeof FormSchema>

export default function StartForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormSchemaType>({ resolver: zodResolver(FormSchema) })

  const ld = useRouteLoaderData<RootLoader>('root')

  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()

  const callsCallback = async () => {
    console.log('callsCallback----')
    const callData = []
    return callData
  }

  const onSubmit = async (data: FormSchemaType) => {
    const checkId = await getSubnameAddress(ld.ENV, `${data.id}.${ld.subdomain}.${ENS_APPCONFIG_NAME}`)

    console.log('form::', data.id, data.name)

    // check alredy exists
    if (checkId) {
      alert('Id already taken')
      return
    }

    if (chainId !== baseSepolia.id) {
      await switchChain({ chainId: baseSepolia.id })
    }

    try {
      const res = await writeContractAsync({
        abi,
        address: REGISTAR_ADDRESS,
        functionName: 'register',
        args: [normalize(data.name), address as `0x${string}`]
      })
      console.log('res:::', res)
    } catch (error: any) {
      console.log(error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-4">
        <div>
          <input {...register('id')} className="w-full" placeholder="Your id" aria-describedby="subname" />
          <small id="subname" className="px-2 pt-0.5 text-sm">
            * Only lowercase letters, numbers, and hyphens
          </small>
          {errors.id && <p className="px-1.5 text-red-400 text-sm">{errors.id.message}</p>}
        </div>
        <div>
          <input {...register('name')} className="w-full" placeholder="Display Name (optional)" />
          {errors.name && <p className="px-1.5 text-red-400 text-sm">{errors.name.message}</p>}
        </div>
        <CustomTransaction calls={callsCallback} btnText="Join" btnClass="btn-main w-full" />
      </div>
    </form>
  )
}
