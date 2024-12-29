import { getFormProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { createRegisterSchema } from '@konxyz/shared/schema/register'
import { Form } from '@remix-run/react'
import { useState } from 'react'
import InputWithError from '~/components/InputWithError'

export default function RegisterForm({ lastResult }: { lastResult: any }) {
  const [asyncError, setAsyncError] = useState('')
  const [isChecking, setIsChecking] = useState(false)

  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      console.log('----form::', parseWithZod(formData, { schema: createRegisterSchema() }))
      return parseWithZod(formData, { schema: createRegisterSchema() })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput'
  })

  console.log('---form client::::', form.errors)

  const isFormValid = !(form.status === 'error') || Object.keys(form.errors).length === 0
  const isAsyncValid = !asyncError && !isChecking

  return (
    <Form method="post" {...getFormProps(form)} noValidate>
      <div>err: {form.errors}</div>
      <div className="space-y-4">
        <InputWithError field={fields.id} hint="Only lowercase letters, numbers, and hyphens." />
        <InputWithError field={fields.name} hint="Optional, can be changed later." />
        <button type="submit" className="btn-main w-full" disabled={!isFormValid}>
          Join
        </button>
      </div>
    </Form>
  )
}
