export const isValidURL = (str: string): boolean => {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ) // fragment locator
  return !!pattern.test(str)
}

export const isValidName = (id: string): boolean => {
  if (id.length < 3 || id.length > 255) return false
  if (!/^[a-z0-9-]+$/.test(id)) return false
  if (id.startsWith('-') || id.endsWith('-')) return false
  return true
}

export const shortAddr = (address: `0x${string}` | undefined): string =>
  !address ? '' : `${address.slice(0, 6)}...${address.slice(-4)}`
