import { FormProvider, getFormProps, useField, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { registerCalls } from '@konxyz/shared/calls/register'
import { checkId } from '@konxyz/shared/lib/app'
import { createRegisterSchema } from '@konxyz/shared/schema/register'
import type { AppConfig } from '@konxyz/shared/types'
import { Form } from 'react-router'
import { useAccount } from 'wagmi'
import ConfirmDialog from '~/components/ConfirmDialog'
import Transaction from '~/components/CustomTransaction'
import InputWithError from '~/components/Input'
import ProfileCard from '~/components/modules/ProfileCard'

export const submittion = async (formData: any, url: string, env: Env) =>
  await parseWithZod(formData, {
    schema: createRegisterSchema({
      async isIdUnique(id: string) {
        const res = await checkId(id, url, env)
        return !res
      }
    }),
    async: true
  })

export default function RegisterForm({
  appConfig,
  lastResult,
  children
}: { appConfig: AppConfig; lastResult: any; children?: React.ReactNode }) {
  const [form, fields] = useForm({
    defaultValue: {
      id: '',
      name: ''
    },
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: createRegisterSchema() })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput'
  })

  return (
    <FormProvider context={form.context}>
      <ProfileCard_ appConfig={appConfig} />
      {children}
      <Form method="post" {...getFormProps(form)}>
        <div className="space-y-4">
          <InputWithError
            field={fields.id}
            hint="Only lowercase letters, numbers, and hyphens."
            placeholder="Your ID"
          />
          <InputWithError
            field={fields.name}
            hint="Optional, can be changed later."
            placeholder="Your Name"
          />
          <button type="submit" className="btn-main w-full">
            Check ID
          </button>
        </div>
      </Form>
    </FormProvider>
  )
}

const ProfileCard_ = ({ appConfig }: { appConfig: AppConfig }) => {
  const id = useField('id')
  const name = useField('name')

  return <ProfileCard appConfig={appConfig} name={name?.[0]?.value} id={id?.[0]?.value} />
}

export const RegisterConfirmDialog = ({
  joinTitle,
  confirmOpen,
  setConfirmOpen
}: {
  joinTitle: string
  confirmOpen: boolean
  setConfirmOpen: (open: boolean) => void
}) => {
  const fieldId = useField('id')
  const fieldName = useField('name')
  const id = fieldId?.[0]?.value ?? ''
  const name = fieldName?.[0]?.value ?? ''
  const { address } = useAccount()

  console.log('calls:', address, id, name, registerCalls(address, id, name))

  return (
    <ConfirmDialog title={joinTitle} open={confirmOpen} onOpenChange={() => setConfirmOpen(!confirmOpen)}>
      <div className="space-y-4">
        <div>
          <label htmlFor="id">Your ID</label>
          <input readOnly type="text" value={id} />
        </div>
        <div>
          <label htmlFor="name">Display Name</label>
          <input readOnly type="text" value={name} />
        </div>
      </div>
      <Transaction
        calls={registerCalls(address, id, name)}
        disabled={!address || !id}
        btnText="Join"
        btnClass="mt-7"
      />
    </ConfirmDialog>
  )
}
