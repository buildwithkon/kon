import { cn } from '@konxyz/shared/lib/utils'

export default function InputWithError({
  field,
  hint,
  inputType = 'text'
}: { field: any; hint?: string; inputType?: string }) {
  return (
    <div>
      <input
        key={field.key}
        name={field.name}
        type={inputType}
        className={cn('w-full border', field?.errors ? 'border-red-400' : 'border-black/20')}
        placeholder="Display Name"
        aria-describedby="displayname"
      />
      {hint && (
        <small id="displayname" className="px-2 pt-0.5 text-xs">
          ⓘ&nbsp;{hint}
        </small>
      )}
      {field?.errors?.map((_err) => (
        <p key={_err} className="px-2 text-red-400 text-xs">
          ❗ {_err}
        </p>
      ))}
    </div>
  )
}
