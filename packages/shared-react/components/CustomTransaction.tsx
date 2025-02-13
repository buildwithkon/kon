import {
  Transaction,
  TransactionButton,
  type TransactionReact,
  TransactionSponsor,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
  TransactionToast,
  TransactionToastAction,
  TransactionToastIcon,
  TransactionToastLabel
} from '@coinbase/onchainkit/transaction'
import { cn } from '@konxyz/shared/lib/utils'

type CustomProps = Omit<TransactionReact, 'children'> & {
  disabled?: boolean
  btnClass?: string
  btnText?: string
  showToast?: boolean
  btnRef?: React.RefObject<HTMLElement>
}

export default function CustomTransaction({
  calls,
  chainId,
  className,
  disabled,
  onError,
  onStatus,
  onSuccess,
  btnClass,
  btnText,
  btnRef,
  showToast = false
}: CustomProps) {
  return (
    <Transaction
      calls={calls}
      chainId={chainId}
      className={className}
      onError={onError}
      onStatus={onStatus}
      onSuccess={onSuccess}
    >
      <div ref={btnRef}>
        <TransactionButton
          disabled={disabled}
          className={cn('btn-main font-bold text-lg text-main-fg hover:bg-main active:bg-main', btnClass)}
          text={btnText}
        />
      </div>
      <TransactionSponsor />
      <TransactionStatus>
        <TransactionStatusLabel />
        <TransactionStatusAction />
      </TransactionStatus>
      {showToast && (
        <TransactionToast position="top-center">
          <TransactionToastIcon />
          <TransactionToastLabel />
          <TransactionToastAction />
        </TransactionToast>
      )}
    </Transaction>
  )
}
