import { useForm } from 'react-hook-form'
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const NameFormSchema = z.object({
  name: z.string().min(3).max(255),
});
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
            Setup your name
          </button>
        </div>
    </form>
  )
}
