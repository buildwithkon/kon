import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form } from '@remix-run/react'
import { z } from 'zod'

export const schema = z.object({
  name: z
    .string()
    .min(3, { message: 'username must be at least 3 characters long.' })
    .max(255, { message: 'username cannot exceed 255 characters.' })
    .regex(/^[a-z0-9-]+$/, { message: 'username can only contain lowercase letters, numbers, and hyphens.' })
    .refine((name) => !name.startsWith('-') && !name.endsWith('-'), {
      message: 'username cannot start or end with a hyphen.'
    })
})

export default function SampleForm() {
  const [form, { name }] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema })
    }
  })

  return (
    <Form method="post" {...getFormProps(form)}>
      <div>
        <input {...getInputProps(name, { type: 'text' })} className="w-full" placeholder="yourname" />
        {name.errors && <p className="mt-1 px-1 text-red-400 text-sm">{name.errors[0]}</p>}
      </div>
      <button type="submit" className="btn-main mt-4 w-full">
        Setup username
      </button>
    </Form>
  )
}
