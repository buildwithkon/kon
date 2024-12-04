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
  btnText
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
      <TransactionButton disabled={disabled} className={btnClass} text={btnText} />
      <TransactionSponsor />
      <TransactionStatus>
        <TransactionStatusLabel />
        <TransactionStatusAction />
      </TransactionStatus>
      <TransactionToast>
        <TransactionToastIcon />
        <TransactionToastLabel />
        <TransactionToastAction />
      </TransactionToast>
    </Transaction>
  )
}
