import { abi as REGISTRAR_ABI } from '~/abis/L2Registrar'
import { abi as REVERSE_REGISTRY_ABI } from '~/abis/L2ReverseRegistrarWithMigration'
import { ENS_APPCONFIG_USER } from '~/lib/const'

// BASE SEPOLIA
const L2_REGISTRAR_ADDRESS = '0x3e201738085730ff2f6cd42d712603643cc05902'
const L2_REVERSE_REGISTRY_ADDRESS = '0x00000BeEF055f7934784D6d81b6BC86665630dbA'
// const REVERSE_REGISTRY_ADDRESS = '0xa12159e5131b1eEf6B4857EEE3e1954744b5033A'
// const REGISTRY_ADDRESS = '0xde364581c00a929edbf80cabbd6aaafb7f2edf62'
import { normalize } from 'viem/ens'

export const registerCalls = (owner: `0x${string}` | undefined, label: string, name?: string) =>
  !!owner && !!label
    ? [
        {
          address: L2_REGISTRAR_ADDRESS,
          abi: REGISTRAR_ABI,
          functionName: 'register',
          args: !name ? [label, owner] : [label, owner, name]
        },
        {
          address: L2_REVERSE_REGISTRY_ADDRESS,
          abi: REVERSE_REGISTRY_ABI,
          functionName: 'setNameForAddr',
          args: [owner, normalize(`${label}.${ENS_APPCONFIG_USER}`)]
        }
      ]
    : []
