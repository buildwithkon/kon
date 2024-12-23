import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { createRegistarSchema } from '@konxyz/shared/schema/registar'
import { Form } from '@remix-run/react'
import InputWithError from '~/components/InputWithError'

export default function RegistorForm({ lastResult }: { lastResult: any }) {
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: createRegistarSchema() })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput'
  })

  return (
    <Form method="POST" id={form.id} onSubmit={form.onSubmit} noValidate>
      <div className="space-y-4">
        <InputWithError field={fields.id} hint="Only lowercase letters, numbers, and hyphens." />
        <InputWithError field={fields.name} hint="Optional, can be changed later." />
        <button type="submit" className="btn-main w-full">
          Join
        </button>
      </div>
    </Form>
  )
}
