'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { mainNav, MONEY_PAGE_SLUGS, site, slugFromPathname } from '@/lib/site'
import { cn } from '@/lib/cn'
import { currentMonthYear } from '@/lib/format'
import Container from './Container'
import StarRating from './StarRating'
import SearchBox from './SearchBox'

/**
 * Reproduces the live WordPress header: logo bar, main nav with the pricelist
 * dropdown, and the blue band carrying the company name, tagline and rating.
 *
 * The mobile menu is the only interactive part, which is why this is the one
 * client component in the layout — everything else stays server-rendered.
 */
export function Header({
  reviewRating = site.reviewRating,
  reviewCount = site.reviewCount,
}: {
  reviewRating?: number
  reviewCount?: number
}) {
  const [open, setOpen] = useState(false)
  const [subOpen, setSubOpen] = useState<string | null>(null)
  const pathname = usePathname()
  const brandIsH1 = !MONEY_PAGE_SLUGS.has(slugFromPathname(pathname || '/'))
  const BrandTag = brandIsH1 ? 'h1' : 'p'

  return (
    <header className="bg-secondary shadow-sm lg:sticky lg:top-0 lg:z-40">
      {/* Logo + navigation */}
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Ideal Roofing System home">
          {/* Plain <img>, not next/image. The logo is an SVG, and routing SVGs
              through the image optimizer requires dangerouslyAllowSVG — which
              turns on SVG optimization for every remote image on the site.
              An SVG is already tiny and resolution-independent; optimizing it
              buys nothing and costs a security flag. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={site.logo}
            alt="Ideal Roofing Logo"
            width={168}
            height={44}
            className="h-10 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  {item.label}
                  {'children' in item && item.children ? (
                    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 fill-current opacity-60">
                      <path d="M5.5 7.5 10 12l4.5-4.5H5.5Z" />
                    </svg>
                  ) : null}
                </Link>

                {'children' in item && item.children ? (
                  // White dropdown with near-black text — matches live
                  // exactly (confirmed via computed styles: #fff bg, #121212
                  // text), inverted from what this build had before.
                  <ul className="invisible absolute left-0 top-full z-50 w-80 rounded-lg border border-surface-border bg-white p-2 opacity-0 shadow-card-hover transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-md px-3 py-2 text-sm text-ink transition-colors hover:bg-surface-soft"
                        >
                          {child.label}
                          {'dated' in child && child.dated ? ' | ' + currentMonthYear() : ''}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className={cn(
            'rounded-md border-2 bg-white p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cta/60 lg:hidden',
            open ? 'border-emerald-400 text-emerald-500' : 'border-cta text-cta'
          )}
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 stroke-current" fill="none" strokeWidth={2} strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </Container>

      {/* Mobile nav — white panel with dark text, matching the live site's
          mobile menu exactly (not the dark page canvas). */}
      <nav
        id="mobile-nav"
        aria-label="Mobile"
        className={cn(
          // border-t only when open — a border on a max-h-0 box still
          // renders as a 1px line even though the box has no visible
          // height, which is exactly the stray line between the header
          // and the page underneath it on every page in mobile view.
          'overflow-hidden bg-white transition-[max-height] duration-300 lg:hidden',
          open ? 'max-h-[32rem] border-t border-surface-border' : 'max-h-0 border-t-0'
        )}
      >
        <Container className="py-2">
          <ul className="divide-y divide-surface-border text-center">
            {mainNav.map((item) => (
              <li key={item.href} className="py-1">
                <div className="flex items-center justify-center gap-2">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block flex-1 py-2 text-sm font-medium text-ink"
                  >
                    {item.label}
                  </Link>
                  {'children' in item && item.children ? (
                    <button
                      type="button"
                      onClick={() => setSubOpen(subOpen === item.href ? null : item.href)}
                      aria-expanded={subOpen === item.href}
                      className="p-2"
                    >
                      <span className="sr-only">Toggle submenu for {item.label}</span>
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                        className={cn(
                          'h-4 w-4 fill-current text-ink transition-transform',
                          subOpen === item.href && 'rotate-180'
                        )}
                      >
                        <path d="M5.5 7.5 10 12l4.5-4.5H5.5Z" />
                      </svg>
                    </button>
                  ) : null}
                </div>

                {'children' in item && item.children && subOpen === item.href ? (
                  <ul className="pb-2">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className="block py-2 text-sm text-ink-muted"
                        >
                          {child.label}
                          {'dated' in child && child.dated ? ' | ' + currentMonthYear() : ''}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </Container>
      </nav>

      {/* Blue band */}
      <div className="bg-secondary text-white">
        <Container className="py-4">
          <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:items-start lg:justify-start lg:gap-8 lg:text-left">
            {/* Left-aligned on mobile (self-start + text-left override the
                parent's items-center/text-center), same on desktop. */}
            <div className="w-full self-start text-left lg:w-auto lg:shrink-0 lg:self-auto">
              {/* Default: the brand name is the site's only H1 (old Neve
                  pattern). On the four money pricelist pages the article
                  title is the H1 instead — this tag becomes a <p> with the
                  same classes so the header looks unchanged. */}
              <BrandTag className="text-[28px] font-bold leading-tight tracking-wide sm:text-[36px] lg:text-[40px]">
                <Link href="/">IDEAL ROOFING SYSTEM</Link>
              </BrandTag>
              <p className="text-xs text-white/85 sm:text-sm">{site.tagline}</p>
            </div>

            {/* Search — present on every page of the live WordPress site.
                Stays right after the name/tagline (not pushed down by the
                star rating/NAP row below) so it's still immediately visible
                on mobile without scrolling past extra content first.
                self-start left-aligns it (matching the name/tagline block)
                instead of being centered by the parent's items-center. */}
            <div className="w-full max-w-sm self-start">
              <SearchBox compact />
            </div>
          </div>

          {/* Star rating, left-aligned (mobile and desktop), plus address
              and phone beneath it — a second row under the name+search row
              (not inside it), so NAP appears on the page itself on every
              page without burying the search box under it. */}
          <div className="mt-3 flex flex-col items-start gap-2 text-left">
            <StarRating
              rating={reviewRating}
              count={reviewCount}
              href="https://www.google.com/search?q=Ideal+Roofing+System"
            />
            <p className="text-xs text-white/80 sm:text-sm">
              {site.business.streetAddress}, {site.business.addressLocality},{' '}
              {site.business.addressRegion} {site.business.postalCode}
              <br />
              <a
                href={'tel:' + site.business.telephone}
                className="font-semibold text-white transition-opacity hover:opacity-80"
              >
                {site.business.telephoneDisplay}
              </a>
            </p>
          </div>
        </Container>
      </div>

      {/* Scrolling ticker — present on every page on the live site, sitting
          right at the bottom of the header. */}
      <div className="marquee-container">
        <div className="marquee-content">
          Trusted By Over 2000+ Engineers and 7000 clients nationwide
        </div>
      </div>
    </header>
  )
}

export default Header
