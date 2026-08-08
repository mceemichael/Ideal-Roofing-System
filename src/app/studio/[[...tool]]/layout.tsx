import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Sanity Studio',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

/**
 * The Studio needs the full viewport and none of the site chrome (header,
 * footer, WhatsApp button). The comment used to claim that's what this file
 * did, but a nested layout can only render *inside* whatever ancestor
 * layout it has — it was still wrapped by the main site's root layout the
 * whole time, which is why the site's blue header/footer/WhatsApp button
 * were visibly bleeding into the Studio UI (confirmed in a real browser,
 * not assumed).
 *
 * The actual fix: `src/app/(site)/` holds the entire rest of the site in a
 * route group with its own root layout (`<html>`/`<body>` there); this file
 * is the *only* layout above `/studio`, making it a second, independent
 * root layout for that branch — Next.js's supported way to have some routes
 * skip a shared root layout entirely. See
 * https://nextjs.org/docs/app/building-your-application/routing/route-groups#creating-multiple-root-layouts
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ height: '100vh', margin: 0 }}>{children}</body>
    </html>
  )
}
