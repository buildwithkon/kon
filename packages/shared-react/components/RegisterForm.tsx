import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { createRegisterSchema } from '@konxyz/shared/schema/register'
import { Form } from 'react-router'
import InputWithError from '~/components/Input'

export default function RegisterForm({ lastResult }: { lastResult: any }) {
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
    <Form method="post" {...getFormProps(form)}>
      <div className="space-y-4">
        <InputWithError field={fields.id} hint="Only lowercase letters, numbers, and hyphens." />
        <InputWithError field={fields.name} hint="Optional, can be changed later." />
        <button type="submit" className="btn-main w-full">
          Check ID
        </button>
      </div>
    </Form>
  )
}
