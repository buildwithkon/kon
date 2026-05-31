/** @jsxImportSource hono/jsx */

export interface RenderIndexOpts {
  name: string
  /**
   * Default IPFS gateway list for the bootstrap script. The runtime then
   * uses manifest.deployment.ipfs_gateways once loaded; this list only
   * covers the brief window between page load and runtime ready.
   */
  bootstrapGateways?: string[]
}

const DEFAULT_BOOTSTRAP_GATEWAYS = ['https://w3s.link', 'https://ipfs.io', 'https://cloudflare-ipfs.com']

/**
 * Minimal index.html shell.
 *
 * The HTML ships in the published directory next to entry.json + manifest.json.
 * An inline bootstrap script:
 *   1. Fetches `./entry.json` (sibling in the same IPFS dir).
 *   2. Reads entry.runtime (an ipfs:// CID for the shared KON runtime).
 *   3. Fetches the manifest — either a relative path `./manifest.json` or a
 *      separate `ipfs://CID` — and follows that.
 *   4. Stashes both in `window.__KON_BOOT__` so the runtime can skip refetching.
 *   5. Imports `<gateway>/ipfs/<runtime-cid>/runtime.js`.
 *
 * Bootstrap size: ~0.7 KB minified. All control flow is `await`-based so the
 * runtime sees a synchronous global by the time it runs.
 */
export function renderIndex(opts: RenderIndexOpts): string {
  const gateways = opts.bootstrapGateways ?? DEFAULT_BOOTSTRAP_GATEWAYS
  const bootstrap = renderBootstrap(gateways)

  const doc = (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{opts.name}</title>
        <meta name="kon:schema" content="kon-entry-v1" />
        <link rel="icon" href="data:," />
      </head>
      <body>
        <div id="kon-root"></div>
        <script type="module" dangerouslySetInnerHTML={{ __html: bootstrap }}></script>
      </body>
    </html>
  )
  return `<!doctype html>\n${doc.toString()}\n`
}

function renderBootstrap(gateways: string[]): string {
  const gatewaysJson = JSON.stringify(gateways)
  return `
const G=${gatewaysJson};
const gw=(cid,p='')=>G[0]+'/ipfs/'+cid+p;
const stripIpfs=(s)=>s.replace(/^ipfs:\\/\\//,'');
const fetchJson=(u)=>fetch(u).then(r=>{if(!r.ok)throw new Error('fetch '+u+' '+r.status);return r.json();});

const entry=await fetchJson('./entry.json');
let manifest;
if(entry.manifest.startsWith('./')||entry.manifest.startsWith('/')){
  manifest=await fetchJson(entry.manifest);
}else{
  manifest=await fetchJson(gw(stripIpfs(entry.manifest)));
}
const runtimeCid=stripIpfs(entry.runtime);
window.__KON_BOOT__={entry,manifest,gateways:G,runtimeCid};
await import(gw(runtimeCid,'/runtime.js'));
`.trim()
}
