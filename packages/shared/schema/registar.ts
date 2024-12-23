import { conformZodMessage } from '@conform-to/zod'
import { z } from 'zod'

// Instead of sharing a schema, prepare a schema creator
export const createRegistarSchema = (options?: {
  isIdUnique: (id: string) => Promise<boolean>
}) =>
  z.object({
    id: z
      .string()
      .min(3, { message: 'ID must be at least 3 characters long.' })
      .max(255, { message: 'ID cannot exceed 255 characters.' })
      .regex(/^[a-z0-9-]+$/, { message: 'ID can only contain lowercase letters, numbers, and hyphens.' })
      .refine((name) => !name.startsWith('-') && !name.endsWith('-'), {
        message: 'ID cannot start or end with a hyphen.'
      })
      // Pipe the schema so it runs only if the email is valid
      .pipe(
        // Note: The callback cannot be async here
        // As we run zod validation synchronously on the client
        z
          .string()
          .superRefine((id, ctx) => {
            // This makes Conform to fallback to server validation
            // by indicating that the validation is not defined
            if (typeof options?.isIdUnique !== 'function') {
              ctx.addIssue({
                code: 'custom',
                message: conformZodMessage.VALIDATION_UNDEFINED,
                fatal: true
              })
              return
            }
            // If it reaches here, then it must be validating on the server
            // Return the result as a promise so Zod knows it's async instead
            return options.isIdUnique(id).then((isUnique) => {
              if (!isUnique) {
                ctx.addIssue({
                  code: 'custom',
                  message: 'Id is already taken.'
                })
              }
            })
          })
      ),
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
