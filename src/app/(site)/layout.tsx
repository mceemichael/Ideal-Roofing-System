import type { Metadata, Viewport } from 'next'
import { GoogleTagManager } from '@next/third-parties/google'

import './globals.css'
import { site } from '@/lib/site'
import { DEFAULT_ROBOTS, absoluteUrl } from '@/lib/seo'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import { sanityFetch } from '../../../sanity/client'
import { siteSettingsQuery } from '../../../sanity/queries'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || site.url),
  // Plain string, no title.template: the live WordPress site never appended
  // " | Ideal Roofing System" to individual post/page titles, only to
  // tag/category/author archive titles — those three build the suffix
  // themselves. A plain string here still applies as the homepage's title
  // (it sets its own via buildMetadata) and as the default for any route
  // that doesn't provide one.
  title: site.title,
  description: site.description,
  applicationName: site.name,
  robots: DEFAULT_ROBOTS,
  alternates: { canonical: absoluteUrl('/') },
  openGraph: {
    type: 'website',
    locale: site.locale,
    siteName: site.name,
    url: absoluteUrl('/'),
    title: site.title,
    description: site.description,
  },
  twitter: {
    card: 'summary_large_image',
    site: site.social.twitterHandle,
    creator: site.social.twitterHandle,
  },
  // A second rel="icon" pointing at the SVG logo used to sit alongside this.
  // Modern browsers render it fine, but stricter favicon fetchers (Bing's
  // SERP thumbnail among them) don't reliably rasterize SVG favicons and can
  // end up showing nothing rather than falling back to the .ico. One
  // unambiguous icon avoids that.
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  // These prove domain ownership to Google, Bing, Facebook and Pinterest.
  // Every one of them exists on your live site today. Dropping any single one
  // silently disconnects a webmaster tool or an ad account, and you find out
  // weeks later.
  verification: {
    google: site.verification.google,
    other: {
      'msvalidate.01': site.verification.bing,
      'facebook-domain-verification': site.verification.facebookDomain,
      'p:domain_verify': site.verification.pinterest,
      'norton-safeweb-site-verification': site.verification.norton,
      'google-adsense-platform-account': site.analytics.adsenseHostAccount,
      'google-adsense-platform-domain': 'sitekit.withgoogle.com',
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  themeColor: site.themeColor,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Falls back to the constants in site.ts if Sanity is unreachable, so a CMS
  // outage degrades to slightly-stale numbers rather than a broken layout.
  const settings = await sanityFetch<any>({
    query: siteSettingsQuery,
    tags: ['siteSettings'],
  }).catch(() => null)

  const reviewRating = settings?.reviewRating ?? site.reviewRating
  const reviewCount = settings?.reviewCount ?? site.reviewCount

  return (
    <html lang="en">
      <head>
        {/* No site-wide Organization/Website JSON-LD here: every route under
            (site) builds its own single connected @graph (organization +
            website + whatever's page-specific) so there's exactly one
            <script type="application/ld+json"> per page, not two. Emitting
            it here too used to duplicate the Organization node — including
            its aggregateRating — on every route that also builds its own,
            which is what Bing's "multiple aggregate ratings" warning was
            catching. See author/[slug] and blogs-and-projects/page/[page]
            for the two routes that build only the site-wide nodes. */}

        {/* Warm up the connections third-party scripts will need anyway. */}
        <link rel="preconnect" href="https://cdn.sanity.io" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
      </head>
      <body className="flex min-h-screen flex-col bg-secondary font-sans text-white antialiased">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>

        <Header reviewRating={reviewRating} reviewCount={reviewCount} />

        <main id="content" className="flex-1">
          {children}
        </main>

        <Footer reviewRating={reviewRating} reviewCount={reviewCount} />
        <WhatsAppFloat />

        {/* GTM. Same container ID as WordPress, so every tag, trigger and
            conversion you have configured keeps working untouched. GTM is
            also what should load AdSense, using the real ca-pub- publisher
            ID — not Site Kit's ca-host-pub- platform account. Loading
            adsbygoogle.js with ca-host-pub-2644536267352236 made
            DoubleClick request /pagead/ads?client=…1:0 and 400, which is
            the PageSpeed "browser errors were logged" finding. The
            google-adsense-platform-* meta tags above stay; those are the
            correct place for the host account. */}
        <GoogleTagManager gtmId={site.analytics.gtmId} />
      </body>
    </html>
  )
}
