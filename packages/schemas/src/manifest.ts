import { z } from 'zod'
import { KonPluginV1Schema, didSchema, ipfsUriSchema } from './plugin'

export const KonThemeV1Schema = z.object({
  main: z.string().min(1),
  accent: z.string().min(1),
  font: z.enum(['sans', 'serif', 'mono']).optional(),
  icon: z.string().min(1).optional()
})

export const KonIconNameSchema = z.enum(['home', 'calendar', 'chat', 'info', 'list'])

export const KonCustomIconV1Schema = z.object({ svg: z.string().min(1) })

/** A built-in icon name, or a custom baked SVG icon. */
export const KonPageIconSchema = z.union([KonIconNameSchema, KonCustomIconV1Schema])

export const KonDeploymentV1Schema = z.object({
  wallet_origin: z.string().url().optional(),
  gun_peers: z.array(z.string().url()).optional(),
  ipfs_gateways: z.array(z.string().url()).optional(),
  ens_domain: z.string().min(1).optional()
})

export const KonPageV1Schema = z.object({
  id: z.string().min(1),
  title: z.string(),
  icon: KonPageIconSchema.optional(),
  source: ipfsUriSchema.optional(),
  plugins: z.array(KonPluginV1Schema).optional()
})

export const KonManifestV1Schema = z.object({
  schema: z.literal('kon-manifest-v1'),
  app: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.number().int().nonnegative(),
    description: z.string().optional(),
    icon: ipfsUriSchema.optional(),
    theme: KonThemeV1Schema.optional()
  }),
  deployment: KonDeploymentV1Schema.optional(),
  pages: z.array(KonPageV1Schema),
  plugins: z.array(KonPluginV1Schema).optional(),
  previous: ipfsUriSchema.optional(),
  publishedAt: z.string().datetime({ offset: true }),
  publisher: didSchema,
  signature: z.string().optional()
})

export type KonManifestV1Schema = z.infer<typeof KonManifestV1Schema>
export type KonDeploymentV1Schema = z.infer<typeof KonDeploymentV1Schema>
export type KonPageV1Schema = z.infer<typeof KonPageV1Schema>
export type KonThemeV1Schema = z.infer<typeof KonThemeV1Schema>
export type KonIconNameSchema = z.infer<typeof KonIconNameSchema>
