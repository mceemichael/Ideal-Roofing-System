/**
 * Single source of truth for site-wide constants.
 *
 * Everything here was read off your live WordPress HTML so the migrated site
 * emits byte-identical metadata. Do not change values marked LOCKED without a
 * reason — they are what Google currently has indexed.
 */

export const site = {
  // LOCKED — must match your current canonical host exactly.
  url: 'https://idealroofingsystem.com',
  name: 'Ideal Roofing System',
  title: 'Ideal Roofing System | Best Roofing Company In Nigeria',
  // Was byte-identical to live's own (typo'd) meta description — "Aluminiun"
  // and a stray comma before "and installation". Fixed 2026-08-03 per an
  // explicit grammar-accuracy pass; a spelling fix carries none of the
  // ranking risk a URL/structure change would, so it's safe to diverge from
  // live's current (still-typo'd) description here.
  description:
    "Ideal Roofing System is a trusted leader in Nigeria's roofing industry, specializing in the sales and installation of Aluminium and Stonecoated Roofing Sheets",
  tagline: 'Leading Roofing Company In Nigeria',
  locale: 'en_US',
  themeColor: '#2f5aae',
  logo: '/wp-content/uploads/2026/03/Ideal-Roofing-Logo-SVG.svg',

  founded: '2009',
  reviewCount: 157,
  reviewRating: 4.9,

  // -------------------------------------------------------------------
  // TODO — VERIFY BEFORE CUTOVER
  // These must be byte-identical to your Google Business Profile. Local pack
  // rankings key off NAP consistency and this is the easiest thing to get
  // subtly wrong. I have deliberately not guessed the street address.
  // -------------------------------------------------------------------
  business: {
    legalName: 'Ideal Roofing System',
    registrationNumber: 'BN: 7788277',
    streetAddress: '83 Dopemu Rd, Orile Agege',
    addressLocality: 'Agege',
    addressRegion: 'Lagos State',
    postalCode: '102212',
    addressCountry: 'NG',
    // Found on your live /roof-area-calculator/ page. Verify the format
    // matches your Google Business Profile before cutover.
    telephone: '+2348059431517',
    telephoneDisplay: '08059431517',
    email: 'info@idealroofingsystem.com',
    latitude: 6.618799391108653,
    longitude: 3.312693551024671,
    priceRange: '₦₦',
    openingHours: [
      'Mo-Fr 08:00-18:00',
      'Sa 09:00-16:00',
    ],
    areaServed: ['Lagos', 'Ogun', 'Osun', 'Nigeria'],
  },

  social: {
    facebook: 'https://www.facebook.com/@idealroofingsystem',
    twitter: 'https://www.x.com/@idealroofingsys',
    twitterHandle: '@idealroofingsys',
    youtube: 'https://www.youtube.com/@idealroofingsystem',
    linkedin: 'https://www.linkedin.com/company/ide-roofing-system',
    instagram: 'https://instagram.com/idealroofingsystem',
    pinterest: 'https://www.pinterest.com/idealroofingsystem',
    whatsapp: 'https://wa.me/message/XMINKDTBAL5WN1',
  },

  /**
   * Payment accounts, as published on /thank-you-for-placing-an-order-with-us/.
   *
   * Rendered from here rather than from CMS content so there is exactly one
   * place to change them — a stale account number on a payment page is the
   * kind of mistake that costs real money.
   */
  bankAccounts: [
    { bank: 'Opay', accountName: 'Ideal Roofing Enterprise', accountNumber: '6115105062' },
    { bank: 'UBA', accountName: 'Ideal Roofing Enterprise', accountNumber: '1028818114' },
    { bank: 'Moniepoint MFB', accountName: 'Ideal Roofing Enterprise', accountNumber: '6042801549' },
  ],

  /** Footer line carried over from the live site. */
  footerNote:
    'If you got here, please patronize us to grow and give you better content',

  googleReviewUrl: 'https://g.page/r/CVdvYhPNN_F4EAI/review',
  facebookReviewUrl: 'https://www.facebook.com/share/1K4qkHMmUx/',

  analytics: {
    gtmId: 'GTM-P4W26V5G',
    adsenseHostAccount: 'ca-host-pub-2644536267352236',
  },

  // Real, third-party-sourced Google reviews widget shown on individual
  // posts (see .claude/rules/seo.md re: not adding self-serving review
  // markup — this is the legitimate, existing exception).
  trustindexWidgetSrc: 'https://cdn.trustindex.io/loader.js?76c08ed770ad9192df546679c7',

  // LOCKED — these prove domain ownership. Removing any one of them silently
  // breaks a webmaster tool or an ad account.
  verification: {
    google: 'kKtlpJmTfvBCOURN6iKp4FuTQ1eVQMCWGJTmV8yi4wA',
    bing: '2ABD4117B5FB587320BD3F375728C1C3',
    facebookDomain: 'oobmpifv52zi8az8cg11vw5ga4o4no',
    pinterest: '9d051f24fa72fbc1ce533b2b41ce075a',
    norton:
      'XZ7JDI-0NGGHLDN66J6DMIK5ICA-5PX20592H50UP1KB1LV-90OCIR05GTXTAJAN2JT3971EF7CQF1VGYULHPCYPXGD-7KXOTP942XHB-P2E2QDIF0I32ZDZ0EYTHF21',
  },
} as const

/** Main navigation — matches the live WordPress menu exactly. */
export const mainNav = [
  { label: 'Ideal Roofing System', href: '/' },
  {
    label: 'Updated Pricelist',
    href: '/pricelist/',
    children: [
      {
        label: 'Best Price of Aluminium Roofing Sheet in Nigeria | July 2026',
        href: '/price-of-aluminium-roofing-sheets-in-2026/',
      },
      {
        label: 'Latest Price of Stone Coated (Gerard) Roof Sheet | July 2026',
        href: '/price-of-stone-coated-gerard-in-lagos-2025/',
      },
      {
        label: 'Latest Price of Rain Gutter / Water collector | 2026',
        href: '/price-of-pvc-rain-gutter-water-collector/',
      },
    ],
  },
  { label: 'Roof Area Calculator', href: '/roof-area-calculator/' },
  { label: 'Blog', href: '/blogs-and-projects/' },
] as const

// Verified 2026-07-30 against the live site directly: /blogs-and-projects/
// has exactly 4 pages for 39 posts (10+10+10+9), confirming WordPress's
// default of 10/page. The original build guessed 14 without live access —
// that was wrong and would have under-paginated (3 pages instead of 4),
// leaving page/4/ 404 despite it being indexed and linked from page 3.
export const POSTS_PER_PAGE = 10

/**
 * Routes that must never be resolved by the /[slug] catch-all, because a
 * dedicated route file owns them.
 */
export const RESERVED_SLUGS = new Set([
  'blogs-and-projects',
  'tag',
  'author',
  'api',
  'studio',
  'search',
  'sitemap.xml',
  'robots.txt',
  'feed.xml',
])
