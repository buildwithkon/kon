import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { createRegisterSchema } from '@konxyz/shared/schema/register'
import { useFetcher } from 'react-router'
import InputWithError from '~/components/Input'

export const submittion = async (formData: any) =>
  await parseWithZod(formData, {
    schema: createRegisterSchema({
      async isIdUnique(id: string) {
        return true
      }
    }),
    async: true
  })

export default function RegisterForm({ lastResult }: { lastResult: any }) {
  const fetcher = useFetcher()

  const [form, fields] = useForm({
    defaultValue: {
      id: '',
      name: ''
    },
    lastResult,
    onValidate({ formData }) {
      console.log('----form::', lastResult, parseWithZod(formData, { schema: createRegisterSchema() }))
      return parseWithZod(formData, { schema: createRegisterSchema() })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput'
  })

  return (
    <fetcher.Form method="post" {...getFormProps(form)}>
      <div className="space-y-4">
        <InputWithError
          field={fields.id}
          hint="Only lowercase letters, numbers, and hyphens."
          placeholder="Your ID"
        />
        <InputWithError field={fields.name} hint="Optional, can be changed later." placeholder="Your Name" />
        <button type="submit" className="btn-main w-full">
          Check ID
        </button>
      </div>
    </fetcher.Form>
  )
}
