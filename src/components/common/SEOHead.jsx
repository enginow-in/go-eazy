import { useEffect } from 'react'

/**
 * SEOHead — Lightweight component for managing document title and meta tags
 * per page without adding external dependencies.
 *
 * Usage:
 *   <SEOHead
 *     title="Cozy PG near University"
 *     description="Find verified PG accommodations near HNBGU campus..."
 *     path="/property/abc-123"
 *   />
 *
 * This sets:
 *   - document.title
 *   - <meta name="description">
 *   - <meta property="og:title">
 *   - <meta property="og:description">
 *   - <meta property="og:url">
 *   - <link rel="canonical">
 */
const SEOHead = ({
  title,
  description,
  path = '',
  image = '/og-image.jpg',
  type = 'website',
}) => {
  const siteTitle = 'GoEazy'
  const baseUrl = 'https://goeazy.vercel.app'
  const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} | Rent Rooms, PGs & Hostels Easily in Uttarakhand`
  const fullUrl = `${baseUrl}${path}`

  useEffect(() => {
    // Set document title
    document.title = fullTitle

    // Helper to set or create a meta tag
    const setMeta = (attr, attrValue, content) => {
      let element = document.querySelector(`meta[${attr}="${attrValue}"]`)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attr, attrValue)
        document.head.appendChild(element)
      }
      element.setAttribute('content', content)
    }

    // Helper to set or create a link tag
    const setLink = (rel, href) => {
      let element = document.querySelector(`link[rel="${rel}"]`)
      if (!element) {
        element = document.createElement('link')
        element.setAttribute('rel', rel)
        document.head.appendChild(element)
      }
      element.setAttribute('href', href)
    }

    // Standard meta tags
    if (description) {
      setMeta('name', 'description', description)
    }

    // Open Graph
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:url', fullUrl)
    if (description) {
      setMeta('property', 'og:description', description)
    }
    if (image) {
      setMeta('property', 'og:image', image.startsWith('http') ? image : `${baseUrl}${image}`)
    }

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    if (description) {
      setMeta('name', 'twitter:description', description)
    }

    // Canonical URL
    setLink('canonical', fullUrl)

    // Cleanup: restore default title on unmount
    return () => {
      document.title = `${siteTitle} | Rent Rooms, PGs & Hostels Easily in Uttarakhand`
    }
  }, [fullTitle, description, fullUrl, image, type])

  return null // This component only manages <head>, renders nothing
}

export default SEOHead
