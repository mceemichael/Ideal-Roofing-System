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
 * The Studio needs the full viewport and none of the site chrome, so it gets
 * its own layout that bypasses the header, footer and WhatsApp button.
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ height: '100vh' }}>{children}</div>
}
