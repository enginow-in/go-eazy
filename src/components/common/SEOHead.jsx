import { Helmet } from 'react-helmet-async'

const DEFAULT_TITLE = 'GoEazy - Find Your Perfect Home in Uttarakhand'
const DEFAULT_DESC = 'Rooms, Flats, Hostels & PGs — verified, affordable, and right where you need to be. Trusted by 50,000+ students & professionals in Uttarakhand.'
const DEFAULT_IMAGE = '/og-image.png'

export const SEOHead = ({ title, description, image, url }) => {
  const pageTitle = title ? `${title} | GoEazy` : DEFAULT_TITLE
  const pageDesc = description || DEFAULT_DESC
  const pageImage = image || DEFAULT_IMAGE

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:image" content={pageImage} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={pageImage} />
    </Helmet>
  )
}
