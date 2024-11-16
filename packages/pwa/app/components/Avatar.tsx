import BoringAvatar from 'boring-avatars'

// @ts-ignore
const BoringAvatar2 = typeof BoringAvatar.default !== 'undefined' ? BoringAvatar.default : BoringAvatar

export default function Avatar({ name, size = 80 }: { name: string; size?: number }) {
  return (
    <BoringAvatar2
      variant="beam"
      name={name ?? ''}
      size={size}
      className="rounded-full border-2 border-white/20"
    />
  )
}
