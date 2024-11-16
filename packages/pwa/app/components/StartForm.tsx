import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form } from '@remix-run/react'
import { z } from 'zod'

export const schema = z.object({
  name: z
    .string()
    .min(3, { message: 'Name must be at least 3 characters long.' })
    .max(255, { message: 'Name cannot exceed 255 characters.' })
    .regex(/^[a-z0-9-]+$/, { message: 'Name can only contain lowercase letters, numbers, and hyphens.' })
    .refine((name) => !name.startsWith('-') && !name.endsWith('-'), {
      message: 'Name cannot start or end with a hyphen.'
    })
})

export default function StartForm() {
  const [form, fields] = useForm({
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onBlur',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    }
  })

  return (
    <Form method="post" {...getFormProps(form)}>
      <div className="space-y-4">
        <input {...getInputProps(fields.name, { type: 'text' })} className="w-full" placeholder="yourname" />
        {fields.name.errors && <span className="px-1.5 text-red-400 text-sm">{fields.name.errors[0]}</span>}
        <button type="submit" className="btn-main w-full">
          Set yourname
        </button>
      </div>
    </Form>
  )
}
