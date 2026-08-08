import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { GoogleTagManager } from '@next/third-parties/google'

import './globals.css'
import { site } from '@/lib/site'
import { DEFAULT_ROBOTS, absoluteUrl } from '@/lib/seo'
import { graph, organizationSchema, websiteSchema } from '@/lib/schema'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppFloat from '@/components/WhatsAppFloat'
import JsonLd from '@/components/JsonLd'
import { sanityFetch } from '../../../sanity/client'
import { siteSettingsQuery } from '../../../sanity/queries'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || site.url),
  title: {
    default: site.title,
    // Matches the Rank Math title pattern currently in use.
    template: '%s | ' + site.name,
  },
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
  icons: {
    icon: [{ url: '/favicon.ico' }, { url: site.logo, type: 'image/svg+xml' }],
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
        <JsonLd data={graph(organizationSchema(), websiteSchema())} />

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
            conversion you have configured keeps working untouched. */}
        <GoogleTagManager gtmId={site.analytics.gtmId} />

        {/* AdSense. `afterInteractive` keeps it off the critical path — the
            WordPress plugin was loading this before first paint, which is a
            measurable chunk of your current LCP. */}
        <Script
          id="adsense"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={
            'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
            site.analytics.adsenseHostAccount
          }
        />
      </body>
    </html>
  )
}
