import { useForm } from '@conform-to/react'
import { parseWithZod } from '@conform-to/zod'
import { Form } from '@remix-run/react'
import { z } from 'zod'

export const FormSchema = z.object({
  id: z
    .string()
    .min(3, { message: 'ID must be at least 3 characters long.' })
    .max(255, { message: 'ID cannot exceed 255 characters.' })
    .regex(/^[a-z0-9-]+$/, { message: 'ID can only contain lowercase letters, numbers, and hyphens.' })
    .refine((name) => !name.startsWith('-') && !name.endsWith('-'), {
      message: 'ID cannot start or end with a hyphen.'
    }),
  name: z
    .string()
    .max(255, { message: 'Display Name cannot exceed 255 characters.' })
    .or(
      z
        .string()
        .optional()
        .transform((value) => value ?? '')
    )
})
export type FormSchemaType = z.infer<typeof FormSchema>

export default function RegistorForm() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: FormSchema })
    },
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput'
  })

  return (
    <Form method="POST" id={form.id} onSubmit={form.onSubmit} noValidate>
      <div className="space-y-4">
        <div>
          <input
            key={fields.id.key}
            name={fields.id.name}
            className="w-full"
            placeholder="Your ID"
            aria-describedby="subname"
          />
          <small id="subname" className="px-2 pt-0.5 text-xs">
            ⓘ&nbsp;Only lowercase letters, numbers, and hyphens.
          </small>
          {fields.id?.errors?.map((_err) => (
            <p key={_err} className="px-2 text-red-400 text-xs">
              ❗ {_err}
            </p>
          ))}
        </div>
        <div>
          <input
            key={fields.name.key}
            name={fields.name.name}
            className="w-full"
            placeholder="Display Name"
            aria-describedby="displayname"
          />
          <small id="displayname" className="px-2 pt-0.5 text-xs">
            ⓘ&nbsp;Optional, can be changed later.
          </small>
          {fields.name?.errors?.map((_err) => (
            <p key={_err} className="px-2 text-red-400 text-xs">
              ❗ {_err}
            </p>
          ))}
        </div>
        <button type="submit" className="btn-main w-full">
          Join
        </button>
      </div>
    </Form>
  )
}
