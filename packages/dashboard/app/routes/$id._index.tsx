import { loadAppConfig } from '@konxyz/shared/lib/app'
import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/cloudflare'
import { useLoaderData } from '@remix-run/react'

export const loader: LoaderFunction = async ({ params, context }: LoaderFunctionArgs) => {
  const env = context?.cloudflare?.env as Env
  const { appConfig } = await loadAppConfig(
    String(params?.id).replace(/\b([\w-]+)\.kon\.eth\b/g, (match, prefix) => `https://${prefix}.kon.xyz`),
    env
  )
  return {
    id: params?.id ?? null,
    appConfig
  }
}

export default function Index() {
  const ld = useLoaderData()

  return (
    <div className="mx-auto h-screen max-w-screen-sm px-6">
      <h1 className="py-2 font-bold text-xl">Config for "{ld?.appConfig.name}"</h1>
      <div className="w-full">
        <p>ID</p>
        <input type="text" value={ld?.appConfig?.id} readOnly />
        <p>Name</p>
        <input type="text" value={ld?.appConfig?.name} readOnly />
        <p>Description</p>
        <textarea value={ld?.appConfig?.description} readOnly />
        <p>Url</p>
        <input type="text" value={ld?.appConfig?.url} readOnly />
        <p>Icons</p>
        <p>favicon</p>
        <input type="text" value={ld?.appConfig?.icons?.favicon} readOnly />
        <p>logo</p>
        <input type="text" value={ld?.appConfig?.colors?.logo} readOnly />
        <p>Version</p>
        <input type="text" value={ld?.appConfig?.version} readOnly />
        <p>Font</p>
        <input type="text" value={ld?.appConfig?.font} readOnly />
        <p>Colors</p>
        <p>main</p>
        <input type="text" value={ld?.appConfig?.colors?.main} readOnly />
        <p>sub</p>
        <input type="text" value={ld?.appConfig?.colors?.sub} readOnly />
      </div>
    </div>
  )
}
