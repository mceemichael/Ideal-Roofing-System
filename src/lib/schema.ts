import { site } from './site'
import { absoluteUrl } from './seo'
import { imageSrc } from '../../sanity/image'

/**
 * JSON-LD structured data, replicating what Rank Math currently emits.
 *
 * Rank Math outputs a connected @graph — Organization, WebSite, WebPage,
 * Article, BreadcrumbList all cross-referenced by @id. Emitting them as
 * disconnected islands technically validates but Google resolves the
 * relationships far less reliably, which is how sites lose their rich results
 * after a migration even though every schema "passes" the test tool.
 * So: one graph, properly wired.
 */

const ORG_ID = site.url + '/#organization'
const WEBSITE_ID = site.url + '/#website'

export function organizationSchema() {
  const b = site.business
  return {
    '@type': ['Organization', 'LocalBusiness', 'RoofingContractor'],
    '@id': ORG_ID,
    name: site.name,
    legalName: b.legalName,
    url: site.url + '/',
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(site.logo).replace(/\/$/, ''),
    },
    image: absoluteUrl(site.logo).replace(/\/$/, ''),
    description: site.description,
    foundingDate: site.founded,
    priceRange: b.priceRange,
    ...(b.telephone && !b.telephone.startsWith('TODO')
      ? { telephone: b.telephone }
      : {}),
    ...(b.telephone && !b.telephone.startsWith('TODO')
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: b.telephone,
            contactType: 'sales',
            areaServed: 'NG',
            availableLanguage: ['en'],
          },
        }
      : {}),
    ...(b.email && !b.email.startsWith('TODO') ? { email: b.email } : {}),
    address: {
      '@type': 'PostalAddress',
      ...(b.streetAddress && !b.streetAddress.startsWith('TODO')
        ? { streetAddress: b.streetAddress }
        : {}),
      addressLocality: b.addressLocality,
      addressRegion: b.addressRegion,
      ...(b.postalCode && !b.postalCode.startsWith('TODO')
        ? { postalCode: b.postalCode }
        : {}),
      addressCountry: b.addressCountry,
    },
    ...(b.latitude && b.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: b.latitude,
            longitude: b.longitude,
          },
        }
      : {}),
    areaServed: b.areaServed.map((name) => ({ '@type': 'Place', name })),
    openingHours: b.openingHours,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: site.reviewRating,
      reviewCount: site.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    sameAs: [
      site.social.facebook,
      site.social.twitter,
      site.social.youtube,
      site.social.linkedin,
      site.social.instagram,
      site.social.pinterest,
    ],
  }
}

export function websiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: site.url + '/',
    name: site.name,
    description: site.description,
    publisher: { '@id': ORG_ID },
    inLanguage: 'en-US',
  }
}

export function breadcrumbSchema(
  items: Array<{ name: string; path: string }>
) {
  return {
    '@type': 'BreadcrumbList',
    '@id': absoluteUrl(items[items.length - 1]?.path || '/') + '#breadcrumb',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function articleSchema(post: {
  title: string
  slug: string
  excerpt?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  featuredImage?: any
  author?: { name?: string; slug?: string } | null
  seo?: { description?: string | null } | null
}) {
  const url = absoluteUrl('/' + post.slug + '/')
  const img = imageSrc(post.featuredImage, 1200)

  return {
    '@type': 'Article',
    '@id': url + '#article',
    headline: post.title,
    description: post.seo?.description || post.excerpt || undefined,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt || post.publishedAt || undefined,
    ...(img ? { image: { '@type': 'ImageObject', url: img } } : {}),
    author: post.author?.name
      ? {
          '@type': 'Person',
          name: post.author.name,
          ...(post.author.slug
            ? { url: absoluteUrl('/author/' + post.author.slug + '/') }
            : {}),
        }
      : { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
  }
}

export function videoSchema(video: {
  url: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  uploadDate?: string | null
}) {
  return {
    '@type': 'VideoObject',
    name: video.title,
    description: video.description || video.title,
    contentUrl: video.url,
    embedUrl: video.url,
    ...(video.thumbnailUrl ? { thumbnailUrl: video.thumbnailUrl } : {}),
    uploadDate: video.uploadDate || undefined,
  }
}

export function faqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

/** Wrap any number of schema nodes into a single connected @graph. */
export function graph(...nodes: unknown[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter(Boolean),
  }
}
