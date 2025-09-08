import { namehash, normalize } from 'viem/ens'

const normalizedName = normalize('kon.xyz')
const node = namehash(normalizedName)

console.log({ normalizedName, node })
