import { FormProvider, getFormProps, useField, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { checkId } from '@konxyz/shared/lib/app'
import { createRegisterSchema } from '@konxyz/shared/schema/register'
import type { AppConfig } from '@konxyz/shared/types'
import type React from 'react'
import { useFetcher } from 'react-router'
import InputWithError from '~/components/Input'
import ProfileCard from '~/components/modules/ProfileCard'

export const submittion = async (formData: any, url: string, env: Env) =>
  await parseWithZod(formData, {
    schema: createRegisterSchema({
      async isIdUnique(id: string) {
        const res = await checkId(id, url, env)
        console.log('----checkId in form-----', res)
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
  const fetcher = useFetcher()

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
      <_ProfileCard appConfig={appConfig} />
      {children}
      <fetcher.Form method="post" {...getFormProps(form)}>
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
      </fetcher.Form>
    </FormProvider>
  )
}

const _ProfileCard = ({ appConfig }: { appConfig: AppConfig }) => {
  const id = useField('id')
  const name = useField('name')

  return <ProfileCard appConfig={appConfig} name={name?.[0]?.value} id={id?.[0]?.value} />
}
