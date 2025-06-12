import type { SVGProps } from 'react'
import type { JSX } from 'react/jsx-runtime'

export default function CoinbaseWallet(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Coinbase Wallet Logo"
      viewBox="0 0 32 32"
      width="32"
      height="32"
      fill="none"
    >
      <title>Coinbase Wallet Logo</title>
      <path
        data-testid="wallet-logo-path"
        d="M0 16C0 24.8356 7.16444 32 16 32C24.8356 32 32 24.8356 32 16C32 7.16444 24.8356 0 16 0C7.16444 0 0 7.16444 0 16ZM11.9111 10.8444C11.32 10.8444 10.8444 11.32 10.8444 11.9111V20.0889C10.8444 20.68 11.32 21.1556 11.9111 21.1556H20.0889C20.68 21.1556 21.1556 20.68 21.1556 20.0889V11.9111C21.1556 11.32 20.68 10.8444 20.0889 10.8444H11.9111Z"
        fill="currentColor"
        fill-rule="evenodd"
        clip-rule="evenodd"
      />
    </svg>
  )
}
