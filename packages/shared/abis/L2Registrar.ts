export const abi = [
  {
    inputs: [{ internalType: 'contract IL2Registry', name: '_registry', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'string', name: 'label', type: 'string' },
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' }
    ],
    name: 'NameRegistered',
    type: 'event'
  },
  {
    inputs: [{ internalType: 'string', name: 'label', type: 'string' }],
    name: 'available',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'chainId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'coinType',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'string', name: 'name', type: 'string' }
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'address', name: 'owner', type: 'address' }
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'registry',
    outputs: [{ internalType: 'contract IL2Registry', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const
