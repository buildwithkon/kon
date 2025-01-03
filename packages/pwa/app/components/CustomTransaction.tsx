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
  showToast = true
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
        <TransactionButton disabled={disabled} className={btnClass} text={btnText} />
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
