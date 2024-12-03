import { TransactionDefault } from '@coinbase/onchainkit/transaction'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouteLoaderData } from '@remix-run/react'
import { useForm } from 'react-hook-form'
import { baseSepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { useAccount, useChainId, useSwitchChain, useWriteContract } from 'wagmi'
import { z } from 'zod'
import { abi } from '~/lib/abis/L2Registar'
import { ENS_APPCONFIG_NAME, REGISTAR_ADDRESS } from '~/lib/const'
import { getSubnameAddress } from '~/lib/ens'

const FormSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Name must be at least 3 characters long.' })
    .max(255, { message: 'Name cannot exceed 255 characters.' })
    .regex(/^[a-z0-9-]+$/, { message: 'Name can only contain lowercase letters, numbers, and hyphens.' })
    .refine((name) => !name.startsWith('-') && !name.endsWith('-'), {
      message: 'Name cannot start or end with a hyphen.'
    })
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

  const onSubmit = async (data: FormSchemaType) => {
    const checkName = await getSubnameAddress(ld.ENV, `${data.name}.${ld.subdomain}.${ENS_APPCONFIG_NAME}`)

    console.log('form::', data.name)

    // check alredy exists
    if (checkName) {
      alert('Subname already taken')
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
        <input {...register('name')} className="w-full" placeholder="yourname" />
        {errors.name && <span className="px-1.5 text-red-400 text-sm">{errors.name.message}</span>}
        <TransactionDefault />
        <button type="submit" className="btn-main w-full">
          Claim your name
        </button>
      </div>
    </form>
  )
}
