import { z } from 'zod'
import { ipfsUriSchema } from './plugin'

const relativePathSchema = z.string().regex(/^\.?\/[^\s]+/, {
  message: 'must start with ./ or /'
})

/** Either an `ipfs://CID...` URI or a relative path within the same directory. */
export const contentRefSchema = z.union([ipfsUriSchema, relativePathSchema])

export const KonEntryV1Schema = z.object({
  schema: z.literal('kon-entry-v1'),
  name: z.string().min(1),
  runtime: ipfsUriSchema,
  manifest: contentRefSchema,
  version: z.number().int().nonnegative(),
  publishedAt: z.string().datetime({ offset: true })
})

export type KonEntryV1Schema = z.infer<typeof KonEntryV1Schema>
