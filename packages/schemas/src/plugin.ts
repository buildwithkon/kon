import { z } from 'zod'

export const ipfsUriSchema = z
  .string()
  .regex(/^ipfs:\/\/[a-z0-9]+/i, { message: 'must start with ipfs:// followed by a CID' })

export const didSchema = z.string().regex(/^did:/, { message: 'must be a DID (did:...)' })

export const KonPluginV1Schema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  source: ipfsUriSchema,
  props: z.record(z.unknown()).optional()
})

export type KonPluginV1Schema = z.infer<typeof KonPluginV1Schema>
