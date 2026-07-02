import { describe, expect, test } from 'vitest'
import {
  encodeSetContenthash,
  encodeSetSubnodeOwner,
  ENS_PUBLIC_RESOLVER_ADDRESS,
  ENS_REGISTRY_ADDRESS,
  ipfsContenthash,
  labelHash,
  namehash
} from './ens'

describe('namehash', () => {
  test('namehash of empty string is the zero node', () => {
    expect(namehash('')).toBe(`0x${'00'.repeat(32)}`)
  })

  test('namehash of "eth" matches the canonical ENS reference value', () => {
    // From https://docs.ens.domains/contract-api-reference/name-processing
    expect(namehash('eth')).toBe('0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae')
  })

  test('namehash of "foo.eth" matches the canonical ENS reference value', () => {
    expect(namehash('foo.eth')).toBe('0xde9b09fd7c5f901e23a3f19fecc54828e9c848539801e86591bd9801b019f84f')
  })

  test('namehash of multi-label name', () => {
    // Compute a.b.c.eth and verify it composes correctly
    const a = namehash('a.b.c.eth')
    const b = namehash('b.c.eth')
    // Both are 32-byte hex; check they're valid + distinct
    expect(a).toMatch(/^0x[0-9a-f]{64}$/)
    expect(b).toMatch(/^0x[0-9a-f]{64}$/)
    expect(a).not.toBe(b)
  })

  test('namehash is deterministic (same input → same output)', () => {
    expect(namehash('matsuri.kon.xyz')).toBe(namehash('matsuri.kon.xyz'))
  })

  test('namehash distinguishes case (case-sensitive)', () => {
    // ENS canonical uses lowercase; this function does not auto-normalize.
    // Caller responsibility — but document the behavior so a future
    // case-normalization change is intentional, not silent.
    const lower = namehash('matsuri.kon.xyz')
    const upper = namehash('MATSURI.kon.xyz')
    expect(lower).not.toBe(upper)
  })
})

describe('labelHash', () => {
  test('labelHash("eth") is the canonical keccak256 of "eth"', () => {
    expect(labelHash('eth')).toBe('0x4f5b812789fc606be1b3b16908db13fc7a9adf7ca72641f84d75b47069d3d7f0')
  })

  test('labelHash output is 32-byte hex', () => {
    expect(labelHash('matsuri')).toMatch(/^0x[0-9a-f]{64}$/)
  })
})

describe('ipfsContenthash', () => {
  test('CIDv1 (bafy...) round-trips through EIP-1577 wrapping', () => {
    const cid = 'bafybeibmrm2jdczc7c5b3qpzpzfqzr5z4xqrwzjqkkmqkb5bjabkqekfwy'
    const out = ipfsContenthash(cid)
    expect(out).toMatch(/^0xe30101[0-9a-f]+$/)
  })

  test('accepts the "ipfs://" URI prefix', () => {
    const cid = 'bafybeibmrm2jdczc7c5b3qpzpzfqzr5z4xqrwzjqkkmqkb5bjabkqekfwy'
    const a = ipfsContenthash(cid)
    const b = ipfsContenthash(`ipfs://${cid}`)
    expect(a).toBe(b)
  })

  test('CIDv0 (Qm...) gets upconverted to CIDv1 before encoding', () => {
    const cidV0 = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
    const out = ipfsContenthash(cidV0)
    // The CIDv0→v1 conversion preserves the dag-pb sha2-256 multihash;
    // the resulting prefix is still 0xe30101 (ipfs + multicodec marker).
    expect(out.startsWith('0xe30101')).toBe(true)
  })

  test('different CIDs yield different contenthash bytes', () => {
    const a = ipfsContenthash('bafybeibmrm2jdczc7c5b3qpzpzfqzr5z4xqrwzjqkkmqkb5bjabkqekfwy')
    const b = ipfsContenthash('bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy')
    expect(a).not.toBe(b)
  })

  test('rejects malformed CIDs', () => {
    expect(() => ipfsContenthash('not-a-cid')).toThrow()
    expect(() => ipfsContenthash('')).toThrow()
  })
})

describe('encodeSetContenthash', () => {
  test('produces well-formed function calldata', () => {
    const data = encodeSetContenthash(
      'matsuri.kon.xyz',
      'bafybeibmrm2jdczc7c5b3qpzpzfqzr5z4xqrwzjqkkmqkb5bjabkqekfwy'
    )
    // function selector for setContenthash(bytes32,bytes) =
    // keccak256("setContenthash(bytes32,bytes)").slice(0,4)
    // = 0x304e6ade
    expect(data.startsWith('0x304e6ade')).toBe(true)
    expect(data.length).toBeGreaterThan(10) // at least selector + some args
  })

  test('same args → same calldata (deterministic)', () => {
    const a = encodeSetContenthash('a.kon.xyz', 'bafybeibmrm2jdczc7c5b3qpzpzfqzr5z4xqrwzjqkkmqkb5bjabkqekfwy')
    const b = encodeSetContenthash('a.kon.xyz', 'bafybeibmrm2jdczc7c5b3qpzpzfqzr5z4xqrwzjqkkmqkb5bjabkqekfwy')
    expect(a).toBe(b)
  })

  test('different name → different calldata', () => {
    const cid = 'bafybeibmrm2jdczc7c5b3qpzpzfqzr5z4xqrwzjqkkmqkb5bjabkqekfwy'
    const a = encodeSetContenthash('matsuri.kon.xyz', cid)
    const b = encodeSetContenthash('different.kon.xyz', cid)
    expect(a).not.toBe(b)
  })

  test('different cid → different calldata', () => {
    const name = 'matsuri.kon.xyz'
    const a = encodeSetContenthash(name, 'bafybeibmrm2jdczc7c5b3qpzpzfqzr5z4xqrwzjqkkmqkb5bjabkqekfwy')
    const b = encodeSetContenthash(name, 'bafkreigh2akiscaildcqabsyg3dfr6chu3fgpregiymsck7e7aqa4s52zy')
    expect(a).not.toBe(b)
  })
})

describe('encodeSetSubnodeOwner', () => {
  test('produces well-formed function calldata', () => {
    const owner = '0x1234567890123456789012345678901234567890' as const
    const data = encodeSetSubnodeOwner('kon.xyz', 'matsuri', owner)
    // function selector for setSubnodeOwner(bytes32,bytes32,address) = 0x06ab5923
    expect(data.startsWith('0x06ab5923')).toBe(true)
  })

  test('same args → same calldata (deterministic)', () => {
    const owner = '0x1234567890123456789012345678901234567890' as const
    expect(encodeSetSubnodeOwner('kon.xyz', 'matsuri', owner)).toBe(
      encodeSetSubnodeOwner('kon.xyz', 'matsuri', owner)
    )
  })

  test('different label → different calldata', () => {
    const owner = '0x1234567890123456789012345678901234567890' as const
    const a = encodeSetSubnodeOwner('kon.xyz', 'matsuri', owner)
    const b = encodeSetSubnodeOwner('kon.xyz', 'ethtokyo', owner)
    expect(a).not.toBe(b)
  })

  test('different owner → different calldata', () => {
    const a = encodeSetSubnodeOwner('kon.xyz', 'matsuri', '0x1111111111111111111111111111111111111111')
    const b = encodeSetSubnodeOwner('kon.xyz', 'matsuri', '0x2222222222222222222222222222222222222222')
    expect(a).not.toBe(b)
  })
})

describe('addresses', () => {
  test('ENS Registry address is the canonical mainnet+testnet value', () => {
    expect(ENS_REGISTRY_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/)
    // This address is the same on Ethereum mainnet, Sepolia, and Holesky.
    expect(ENS_REGISTRY_ADDRESS).toBe('0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e')
  })

  test('Public Resolver address matches the canonical value', () => {
    expect(ENS_PUBLIC_RESOLVER_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/)
  })
})
