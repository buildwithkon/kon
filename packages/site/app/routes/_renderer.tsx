import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, Script } from 'honox/server'

export default jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/static/favicon.png" />
        <title>Build with KON</title>
        <meta name="description" content="Build your own PWA apps in minutes" />
        <Link href="/app/style.css" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400,700&display=swap"
          rel="stylesheet"
        />
        <Script src="/app/client.ts" />
      </head>
      <body>{children}</body>
    </html>
  )
})
