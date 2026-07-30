import Link from 'next/link'
import { mainNav, site } from '@/lib/site'
import Container from './Container'
import StarRating from './StarRating'

const socials = [
  { label: 'Facebook', href: site.social.facebook, path: 'M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z' },
  { label: 'X', href: site.social.twitter, path: 'M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.11l11.97 15.64Z' },
  { label: 'YouTube', href: site.social.youtube, path: 'M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.8ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z' },
  { label: 'LinkedIn', href: site.social.linkedin, path: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14Zm1.78 13.02H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z' },
  { label: 'Instagram', href: site.social.instagram, path: 'M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.89 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16ZM12 0C8.74 0 8.33.01 7.05.07 2.7.27.28 2.69.08 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z' },
  { label: 'WhatsApp', href: site.social.whatsapp, path: 'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35M12.05 21.79a9.87 9.87 0 0 1-5.03-1.38l-.36-.22-3.74.99 1-3.65-.24-.38A9.86 9.86 0 0 1 2.17 11.9c0-5.45 4.43-9.89 9.89-9.89a9.82 9.82 0 0 1 6.99 2.9 9.83 9.83 0 0 1 2.89 7c0 5.44-4.44 9.88-9.89 9.88M20.46 3.49A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.44c6.55 0 11.89-5.33 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z' },
  { label: 'Pinterest', href: site.social.pinterest, path: 'M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.43 7.63 11.17-.1-.95-.2-2.4.04-3.44.22-.94 1.4-5.96 1.4-5.96s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.03 0 1.52.77 1.52 1.69 0 1.03-.65 2.57-.99 4-.29 1.2.6 2.17 1.78 2.17 2.13 0 3.77-2.25 3.77-5.5 0-2.87-2.06-4.88-5.01-4.88-3.41 0-5.42 2.56-5.42 5.21 0 1.03.4 2.14.9 2.74.1.12.11.22.08.34-.09.38-.3 1.2-.34 1.37-.05.22-.18.27-.41.16-1.52-.71-2.47-2.93-2.47-4.72 0-3.84 2.79-7.37 8.05-7.37 4.22 0 7.51 3.01 7.51 7.04 0 4.2-2.65 7.58-6.32 7.58-1.24 0-2.4-.64-2.79-1.4l-.76 2.9c-.28 1.06-1.02 2.38-1.52 3.19 1.15.35 2.36.55 3.62.55 6.63 0 12-5.37 12-12S18.63 0 12 0Z' },
]

export function Footer({
  reviewRating = site.reviewRating,
  reviewCount = site.reviewCount,
}: {
  reviewRating?: number
  reviewCount?: number
}) {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 bg-secondary text-white">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-lg font-bold tracking-wide">IDEAL ROOFING SYSTEM</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
              {site.description}
            </p>
            <p className="mt-4 text-sm text-white/70">
              {site.business.addressLocality}, {site.business.addressRegion}, Nigeria
              <br />
              {site.business.registrationNumber}
            </p>

            {/* Click-to-call. On mobile — which is most of your traffic — a
                tel: link is one tap instead of copy-paste. */}
            <p className="mt-3">
              <a
                href={'tel:' + site.business.telephone}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-opacity hover:opacity-80"
              >
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 fill-current">
                  <path d="M2.5 4.5A2 2 0 0 1 4.5 2.5h1.6a1 1 0 0 1 .97.76l.7 2.8a1 1 0 0 1-.5 1.12l-1.2.6a11 11 0 0 0 4.65 4.65l.6-1.2a1 1 0 0 1 1.12-.5l2.8.7a1 1 0 0 1 .76.97v1.6a2 2 0 0 1-2 2A13.5 13.5 0 0 1 2.5 4.5Z" />
                </svg>
                {site.business.telephoneDisplay}
              </a>
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-white/70 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/about-us/" className="text-sm text-white/70 transition-colors hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services/" className="text-sm text-white/70 transition-colors hover:text-white">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy/" className="text-sm text-white/70 transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Pricelists
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link href="/price-of-aluminium-roofing-sheets-in-2026/" className="text-sm text-white/70 transition-colors hover:text-white">
                  Aluminium Roofing Sheets
                </Link>
              </li>
              <li>
                <Link href="/price-of-stone-coated-gerard-in-lagos-2025/" className="text-sm text-white/70 transition-colors hover:text-white">
                  Stone Coated (Gerard)
                </Link>
              </li>
              <li>
                <Link href="/price-of-pvc-rain-gutter-water-collector/" className="text-sm text-white/70 transition-colors hover:text-white">
                  PVC Rain Gutter
                </Link>
              </li>
              <li>
                <Link href="/price-of-alu-zinc-in-lagos/" className="text-sm text-white/70 transition-colors hover:text-white">
                  Alu-Zinc
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-5 border-t border-white/15 pt-8 sm:flex-row sm:justify-between">
          <ul className="flex flex-wrap items-center gap-3">
            {socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-white">
                    <path d={s.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>

          <StarRating
            rating={reviewRating}
            count={reviewCount}
            href="https://www.google.com/search?q=Ideal+Roofing+System"
          />
        </div>

        {site.footerNote ? (
          <p className="mt-8 text-center text-sm text-white/60">
            {site.footerNote}
          </p>
        ) : null}

        <p className="mt-3 text-center text-xs text-white/50">
          © {year} {site.name}. All rights reserved.
        </p>
      </Container>
    </footer>
  )
}

export default Footer
