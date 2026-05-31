/** @jsxImportSource hono/jsx */

export interface RenderIndexOpts {
  name: string
  entryCidPlaceholder: string
}

/**
 * Minimal index.html shell. The actual app boots from the entry → runtime →
 * manifest chain loaded by the Public Runtime; this HTML is just the
 * delivery vessel that fetches and starts the runtime.
 */
export function renderIndex(opts: RenderIndexOpts): string {
  const doc = (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{opts.name}</title>
        <meta name="kon:schema" content="kon-entry-v1" />
        <meta name="kon:entry" content={opts.entryCidPlaceholder} />
        <link rel="icon" href="data:," />
      </head>
      <body>
        <div id="kon-root"></div>
        <script type="module" src="/runtime.js"></script>
      </body>
    </html>
  )
  return `<!doctype html>\n${doc.toString()}\n`
}
