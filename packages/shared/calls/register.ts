import { abi as REGISTRAR_ABI } from '~/abis/L2Registrar'

// BASE SEPOLIA
const REGISTRAR_ADDRESS = '0x3e201738085730ff2f6cd42d712603643cc05902'
const REGISTRY_ADDRESS = '0xde364581c00a929edbf80cabbd6aaafb7f2edf62'

export const registerCalls = (owner: `0x${string}` | undefined, label: string, name?: string) =>
  !!owner && !!label
    ? [
        {
          address: REGISTRAR_ADDRESS,
          abi: REGISTRAR_ABI,
          functionName: 'register',
          args: !name ? [label, owner] : [label, owner, name]
        }
      ]
    : []
