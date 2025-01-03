import { abi } from '@konxyz/shared/abis/L2Register'
import { ENS_APPCONFIG_NAME } from '@konxyz/shared/lib/const'

export const generateRegisterCalls = (subdomain: string, owner: string, label: string, name?: string) => [
  {
    address: '0xde364581c00a929edbf80cabbd6aaafb7f2edf62',
    abi,
    functionName: 'register',
    args: [label, owner]
  },
  name && {
    address: '0xde364581c00a929edbf80cabbd6aaafb7f2edf62',
    abi,
    functionName: 'setText',
    args: [`${label}.${subdomain}.${ENS_APPCONFIG_NAME}`, 'name', name]
  }
]
