type IconProps = {
  size?: number
  className?: string
}

export default function Icon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      height={props?.size ?? 128}
      width={props?.size ?? 128}
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M14 4h5v2h1v10h1v-1h1v-1h5v1h3V8h1V7h1V6h3v1h1v1h1v10h-1v4h1v4h-1v1h-1v4h-1v3h-1v2h-1v1h-1v2h-1v2h2v4H11v-4h2v-4h1v-2h-1v-4h-1V21h1V5h1zm18 11h1v1h1v2h1V8h-2v1h-1zm-3 3h1v2h1v3h1v1h1v1h2v-3h-1v-2h-1v-2h-1v-1h-3zm-7 2h3v2h1v2h1v1h3v-1h-1v-2h-1v-2h-1v-3h-1v-1h-3v1h-1v1h-1v1h-1v1h-1v-1h-1V6h-3v15h-1v10h1v4h1v2h-1v4h13v-2h1v-2h1v-2h1v-1h1v-2h-4v1h-2v2h-1v1h-1v-3h1v-1h1v-1h1v-1h6v-2H20v-1h-1v-1h-1v-2h2v1h1v1h1v1h2v-1h1v-2h-1v-2h-2zm5 23h2v-1h-2z"
      />
    </svg>
  )
}
