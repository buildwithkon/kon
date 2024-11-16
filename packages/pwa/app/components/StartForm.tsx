import { useForm } from 'react-hook-form'
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const NameFormSchema = z.object({
  name: z.string()
  .min(3, { message: "Name must be at least 3 characters long." })
  .max(255, { message: "Name cannot exceed 255 characters." })
  .regex(/^[a-z0-9-]+$/, { message: "Name can only contain lowercase letters, numbers, and hyphens." })
  .refine(name => !name.startsWith('-') && !name.endsWith('-'), {
    message: "Name cannot start or end with a hyphen."
  })
})
type NameFormSchemaType = z.infer<typeof NameFormSchema>;

export default function StartForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<NameFormSchemaType>({ resolver: zodResolver(NameFormSchema) })

  const onSubmit = async (data: NameFormSchemaType) => {
    console.log('form:::', data)
  }

  return (
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <input {...register('name')} className="w-full" placeholder="yourname" />
          {errors.name && <span className="text-sm px-1.5 text-red-400">{errors.name.message}</span>}
          <button type="submit" className="btn-main w-full">
            Claim your name
          </button>
        </div>
    </form>
  )
}
