export const fmtNum = (num: number | undefined, digits = 0) =>
  num ? num.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '-'
