export const abi = [
  {
    type: 'constructor',
    inputs: [{ name: '_registry', type: 'address', internalType: 'contract IL2Registry' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'available',
    inputs: [{ name: 'label', type: 'string', internalType: 'string' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'chainId',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'coinType',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'register',
    inputs: [
      { name: 'label', type: 'string', internalType: 'string' },
      { name: 'owner', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'registry',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract IL2Registry' }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'NameRegistered',
    inputs: [
      { name: 'label', type: 'string', indexed: true, internalType: 'string' },
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' }
    ],
    anonymous: false
  }
] as const
