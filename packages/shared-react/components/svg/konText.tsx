type IconProps = {
  size?: number
  width?: number
  height?: number
  className?: string
}

export default function Icon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 80"
      height={props?.height ?? props?.size ?? 80}
      width={props?.width ?? props?.size ?? 200}
      {...props}
    >
      <path
        d="M39.384 27.808V41.728H14.904V79.168H0.984V0.159998H14.904V27.808H39.384ZM39.384 27.808V13.984H53.208V27.808H39.384ZM53.208 0.159998H67.128V13.984H53.208V0.159998ZM53.208 65.344H39.384V41.728H53.208V65.344ZM53.208 65.344H67.128V79.168H53.208V65.344ZM106.315 39.616L97.2908 19.744L88.2668 39.616L97.2908 59.584L106.315 39.616ZM121.195 39.616L102.763 79.168H91.8188L73.3867 39.616L91.8188 0.159998H102.763L121.195 39.616ZM134.39 0.159998H148.31V60.544L180.47 0.159998H199.19V79.168H185.366V18.784L153.206 79.168H134.39V0.159998Z"
        fill="currentColor"
      />
    </svg>
  )
}
