import { z } from 'zod'
import { ipfsUriSchema } from './plugin'

export const KonEntryV1Schema = z.object({
  schema: z.literal('kon-entry-v1'),
  name: z.string().min(1),
  runtime: ipfsUriSchema,
  manifest: ipfsUriSchema,
  version: z.number().int().nonnegative(),
  publishedAt: z.string().datetime({ offset: true })
})

export type KonEntryV1Schema = z.infer<typeof KonEntryV1Schema>
