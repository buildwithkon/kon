import { abi as REGISTRY_ABI } from '@konxyz/shared/abis/L2Registry'
import { abi as REVERSE_REGISTRY_ABI } from '@konxyz/shared/abis/L2ReverseRegistrarWithMigration'
import { L2_REGISTRY_ADDRESS, L2_REVERSE_REGISTRY_ADDRESS } from '@konxyz/shared/calls/register'
import { baseSepolia } from 'viem/chains'
import { namehash } from 'viem/ens'
import { useReadContract, useReadContracts } from 'wagmi'

const l2ReverseRegistryContract = {
  address: L2_REVERSE_REGISTRY_ADDRESS,
  abi: REVERSE_REGISTRY_ABI,
  chainId: baseSepolia.id
} as const

const l2RegistryContract = {
  address: L2_REGISTRY_ADDRESS,
  abi: REGISTRY_ABI,
  chainId: baseSepolia.id
} as const

export function useEnsUser(address: `0x${string}`) {
  const res1 = useReadContract({
    ...l2ReverseRegistryContract,
    functionName: 'nameForAddr',
    args: [address],
    query: {
      enabled: !!address
    }
  })

  const uid = res1.data as string
  console.log('UID:', uid, res1, namehash(uid))

  const TEXT_KEYS: string[] = ['name', 'avatar']

  const res2 = useReadContracts({
    contracts: [
      ...TEXT_KEYS.map((key) => ({
        ...l2RegistryContract,
        functionName: 'text',
        args: [namehash(uid), key]
      }))
    ],
    query: {
      enabled: !!uid
    }
  })

  return {
    ...res2
  }
}
