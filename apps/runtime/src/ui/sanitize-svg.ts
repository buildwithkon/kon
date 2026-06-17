/**
 * Sanitize an inline SVG string before rendering it in the runtime.
 *
 * Page icons can be custom SVGs baked into the manifest (e.g. picked from
 * react-icons in the editor). The runtime renders manifests from arbitrary ENS
 * names, so that SVG is untrusted input — strip anything scriptable and keep
 * only a safe allowlist of SVG shape/markup elements. Returns '' if the input
 * isn't a parseable single <svg>.
 *
 * The root <svg> is normalized to width/height 1em so it scales with the
 * surrounding font-size and inherits currentColor (react-icons already emit
 * fill/stroke="currentColor").
 */
const ALLOWED_TAGS = new Set([
  'svg',
  'path',
  'g',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
  'defs',
  'clippath',
  'lineargradient',
  'radialgradient',
  'stop',
  'use',
  'title',
  'mask',
  'symbol'
])

function scrub(el: Element): void {
  // Snapshot the live collections (Array.from) before mutating during iteration.
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase()
    if (name.startsWith('on')) {
      el.removeAttribute(attr.name)
    } else if ((name === 'href' || name === 'xlink:href') && /^\s*(javascript|data):/i.test(attr.value)) {
      el.removeAttribute(attr.name)
    }
  }
  for (const child of Array.from(el.children)) {
    if (ALLOWED_TAGS.has(child.tagName.toLowerCase())) {
      scrub(child)
    } else {
      child.remove()
    }
  }
}

export function sanitizeSvg(input: string): string {
  if (typeof input !== 'string' || !input.includes('<svg')) return ''
  let doc: Document
  try {
    doc = new DOMParser().parseFromString(input, 'image/svg+xml')
  } catch {
    return ''
  }
  if (doc.querySelector('parsererror')) return ''
  const svg = doc.querySelector('svg')
  if (!svg) return ''
  scrub(svg)
  svg.setAttribute('width', '1em')
  svg.setAttribute('height', '1em')
  return svg.outerHTML
}
