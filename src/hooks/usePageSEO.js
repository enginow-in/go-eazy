import { useEffect } from 'react'

/**
 * usePageSEO — Dynamic per-page SEO hook
 *
 * Updates <title>, <meta name="description">, Open Graph tags, and injects
 * a JSON-LD <script> block into <head> for structured data. Cleans up
 * (restores defaults) on unmount so navigating away never leaves stale tags.
 *
 * @param {Object} options
 * @param {string}  options.title          - Page <title> value
 * @param {string}  [options.description]  - Meta description content
 * @param {string}  [options.image]        - Absolute URL for og:image
 * @param {string}  [options.url]          - Canonical / og:url for this page
 * @param {Object}  [options.structuredData] - JSON-LD object to inject
 *
 * @example
 * usePageSEO({
 *   title: 'PG in Dehradun | GoEazy',
 *   description: 'Spacious PG near Clock Tower...',
 *   image: 'https://…/photo.jpg',
 *   url: 'https://goeazy.in/property/abc123',
 *   structuredData: { '@context': 'https://schema.org', … },
 * })
 */
export function usePageSEO({ title, description, image, url, structuredData } = {}) {
  useEffect(() => {
    // ── helpers ────────────────────────────────────────────────────────────
    const setMeta = (selector, attr, value) => {
      if (!value) return
      let el = document.querySelector(selector)
      if (!el) {
        el = document.createElement('meta')
        // derive the attribute key from the selector (e.g. name="…" or property="…")
        const [key, val] = selector.match(/\[(\w+)="([^"]+)"\]/).slice(1)
        el.setAttribute(key, val)
        document.head.appendChild(el)
      }
      el.setAttribute(attr, value)
    }

    const removeMeta = (selector) => {
      document.querySelector(selector)?.remove()
    }

    // ── title ──────────────────────────────────────────────────────────────
    const prevTitle = document.title
    if (title) document.title = title

    // ── description ────────────────────────────────────────────────────────
    const prevDesc = document.querySelector('meta[name="description"]')?.content
    if (description) setMeta('meta[name="description"]', 'content', description)

    // ── Open Graph ─────────────────────────────────────────────────────────
    const prevOgTitle = document.querySelector('meta[property="og:title"]')?.content
    const prevOgDesc  = document.querySelector('meta[property="og:description"]')?.content
    const prevOgImg   = document.querySelector('meta[property="og:image"]')?.content
    const prevOgUrl   = document.querySelector('meta[property="og:url"]')?.content

    if (title)       setMeta('meta[property="og:title"]',       'content', title)
    if (description) setMeta('meta[property="og:description"]', 'content', description)
    if (image)       setMeta('meta[property="og:image"]',       'content', image)
    if (url)         setMeta('meta[property="og:url"]',         'content', url)

    // ── Twitter card ───────────────────────────────────────────────────────
    if (title)       setMeta('meta[name="twitter:title"]',       'content', title)
    if (description) setMeta('meta[name="twitter:description"]', 'content', description)
    if (image)       setMeta('meta[name="twitter:image"]',       'content', image)

    // ── Canonical link ─────────────────────────────────────────────────────
    let canonicalEl = document.querySelector('link[rel="canonical"]')
    const prevCanonical = canonicalEl?.href
    if (url) {
      if (!canonicalEl) {
        canonicalEl = document.createElement('link')
        canonicalEl.rel = 'canonical'
        document.head.appendChild(canonicalEl)
      }
      canonicalEl.href = url
    }

    // ── JSON-LD structured data ────────────────────────────────────────────
    const JSONLD_ID = 'page-jsonld'
    let jsonldEl = document.getElementById(JSONLD_ID)

    if (structuredData) {
      if (!jsonldEl) {
        jsonldEl = document.createElement('script')
        jsonldEl.id   = JSONLD_ID
        jsonldEl.type = 'application/ld+json'
        document.head.appendChild(jsonldEl)
      }
      jsonldEl.textContent = JSON.stringify(structuredData)
    }

    // ── Cleanup: restore previous state on unmount ─────────────────────────
    return () => {
      // title
      document.title = prevTitle

      // description
      if (description) {
        const el = document.querySelector('meta[name="description"]')
        if (el) {
          if (prevDesc) el.setAttribute('content', prevDesc)
          else el.remove()
        }
      }

      // OG
      if (title)       { const el = document.querySelector('meta[property="og:title"]');       if (el) { prevOgTitle ? el.setAttribute('content', prevOgTitle) : el.remove() } }
      if (description) { const el = document.querySelector('meta[property="og:description"]'); if (el) { prevOgDesc  ? el.setAttribute('content', prevOgDesc)  : el.remove() } }
      if (image)       { const el = document.querySelector('meta[property="og:image"]');       if (el) { prevOgImg   ? el.setAttribute('content', prevOgImg)   : el.remove() } }
      if (url)         { const el = document.querySelector('meta[property="og:url"]');         if (el) { prevOgUrl   ? el.setAttribute('content', prevOgUrl)   : el.remove() } }

      // Twitter (created dynamically — just remove)
      if (title)       removeMeta('meta[name="twitter:title"]')
      if (description) removeMeta('meta[name="twitter:description"]')
      if (image)       removeMeta('meta[name="twitter:image"]')

      // Canonical
      if (url) {
        const el = document.querySelector('link[rel="canonical"]')
        if (el) {
          if (prevCanonical) el.href = prevCanonical
          else el.remove()
        }
      }

      // JSON-LD
      document.getElementById(JSONLD_ID)?.remove()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image, url, JSON.stringify(structuredData)])
}
