import { namehash } from 'viem/ens'
import { normalize } from 'viem/ens'
import { abi as REGISTRAR_ABI } from '~/abis/L2Registrar'
import { abi as REGISTRY_ABI } from '~/abis/L2Registry'
import { abi as REVERSE_REGISTRY_ABI } from '~/abis/L2ReverseRegistrarWithMigration'
import { getEnsAppConfigUser } from '~/lib/const'

// BASE SEPOLIA
export const L2_REGISTRY_ADDRESS = '0xde364581c00a929edbf80cabbd6aaafb7f2edf62'
export const L2_REGISTRAR_ADDRESS = '0x3e201738085730ff2f6cd42d712603643cc05902'
export const L2_REVERSE_REGISTRY_ADDRESS = '0x00000BeEF055f7934784D6d81b6BC86665630dbA'

export const registerCalls = (
  owner: `0x${string}` | undefined,
  label: string,
  name?: string,
  avatar?: string
) => {
  if (!owner || !label) return []

  const baseCalls = [
    {
      address: L2_REGISTRAR_ADDRESS,
      abi: REGISTRAR_ABI,
      functionName: 'register',
      args: [label, owner]
    },
    {
      address: L2_REVERSE_REGISTRY_ADDRESS,
      abi: REVERSE_REGISTRY_ABI,
      functionName: 'setNameForAddr',
      args: [owner, normalize(`${label}.${getEnsAppConfigUser()}`)]
    }
  ]

  const nameCall = name
    ? [
        {
          address: L2_REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'setText',
          args: [namehash(`${label}.user.kon.wtf`), 'name', name]
        }
      ]
    : []

  const avatarCall = avatar
    ? [
        {
          address: L2_REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'setText',
          args: [namehash(`${label}.user.kon.wtf`), 'avatar', avatar]
        }
      ]
    : []

  return [...baseCalls, ...nameCall, ...avatarCall]
}
