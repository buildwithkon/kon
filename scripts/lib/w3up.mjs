// web3.storage (w3up) upload helper for the publish pipeline.
//
// Env vars required for upload:
//   W3_PRINCIPAL  base64 ed25519 signing key (from `w3 key create`)
//   W3_PROOF      base64 delegation proof granting upload to your space
//
// readCredentialsFromEnv() returns null when env is unset so callers can
// fall back to dry-run mode. ensureClient + uploadFile use dynamic
// imports so the dry-run path does not pay the cost of loading w3up
// or hit the transitive subpath-export quirks some Node versions show.

export function readCredentialsFromEnv() {
  const principal = process.env.W3_PRINCIPAL
  const proof = process.env.W3_PROOF
  if (!principal || !proof) return null
  return { principal, proof }
}

export async function ensureClient(creds) {
  const { create: createW3Client } = await import('@web3-storage/w3up-client')
  const { StoreMemory } = await import('@web3-storage/w3up-client/stores/memory')
  const Proof = await import('@web3-storage/w3up-client/proof')
  const { Signer } = await import('@web3-storage/w3up-client/principal/ed25519')

  const principal = Signer.parse(creds.principal)
  const store = new StoreMemory()
  const client = await createW3Client({ principal, store })
  const delegation = await Proof.parse(creds.proof)
  const space = await client.addSpace(delegation)
  await client.setCurrentSpace(space.did())
  return client
}

export async function uploadFile(client, name, content) {
  const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : content
  const blob = new Blob([bytes])
  const file = new File([blob], name)
  const cid = await client.uploadFile(file)
  return cid.toString()
}

export async function uploadDirectory(client, entries) {
  const files = entries.map((e) => {
    const bytes = typeof e.content === 'string' ? new TextEncoder().encode(e.content) : e.content
    return new File([new Blob([bytes])], e.name)
  })
  const cid = await client.uploadDirectory(files)
  return cid.toString()
}

// Walk a directory on disk and upload every file as a UnixFS directory.
// Used for the site build (entire dist/), the runtime build, and any
// other situation where the publish target is a static folder tree
// rather than a single file.
export async function uploadDirFromDisk(client, dirPath) {
  const { readdir, readFile } = await import('node:fs/promises')
  const { join, relative } = await import('node:path')

  async function* walk(dir) {
    const items = await readdir(dir, { withFileTypes: true })
    for (const item of items) {
      const full = join(dir, item.name)
      if (item.isDirectory()) yield* walk(full)
      else if (item.isFile()) yield full
    }
  }

  const files = []
  for await (const full of walk(dirPath)) {
    const bytes = await readFile(full)
    // Force forward slashes so IPFS directory layout is stable cross-OS.
    const rel = relative(dirPath, full).split('\\').join('/')
    files.push(new File([new Blob([bytes])], rel))
  }
  if (files.length === 0) {
    throw new Error('uploadDirFromDisk: no files found under ' + dirPath)
  }
  const cid = await client.uploadDirectory(files)
  return { cid: cid.toString(), count: files.length }
}
