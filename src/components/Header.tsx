'use client'

import { useState } from 'react'
import Link from 'next/link'
import { mainNav, site } from '@/lib/site'
import { cn } from '@/lib/cn'
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

  return (
    <header className="sticky top-0 z-40 bg-secondary shadow-sm">
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
                  <ul className="invisible absolute left-0 top-full z-50 w-80 rounded-lg border border-white/20 bg-brand-700 p-2 opacity-0 shadow-card-hover transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          className="block rounded-md px-3 py-2 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          {child.label}
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
          className="rounded-md p-2 text-white lg:hidden"
        >
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 stroke-current" fill="none" strokeWidth={2} strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </Container>

      {/* Mobile nav */}
      <nav
        id="mobile-nav"
        aria-label="Mobile"
        className={cn(
          'overflow-hidden border-t border-white/20 bg-brand-700 transition-[max-height] duration-300 lg:hidden',
          open ? 'max-h-[32rem]' : 'max-h-0'
        )}
      >
        <Container className="py-2">
          <ul className="divide-y divide-white/10">
            {mainNav.map((item) => (
              <li key={item.href} className="py-1">
                <div className="flex items-center justify-between">
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block flex-1 py-2 text-sm font-medium text-white"
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
                          'h-4 w-4 fill-current text-white transition-transform',
                          subOpen === item.href && 'rotate-180'
                        )}
                      >
                        <path d="M5.5 7.5 10 12l4.5-4.5H5.5Z" />
                      </svg>
                    </button>
                  ) : null}
                </div>

                {'children' in item && item.children && subOpen === item.href ? (
                  <ul className="pb-2 pl-4">
                    {item.children.map((child) => (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={() => setOpen(false)}
                          className="block py-2 text-sm text-white/80"
                        >
                          {child.label}
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
        <Container className="flex flex-col items-center gap-3 py-3 text-center lg:flex-row lg:justify-between lg:text-left">
          <div className="shrink-0">
            <Link href="/" className="text-base font-bold tracking-wide sm:text-lg">
              IDEAL ROOFING SYSTEM
            </Link>
            <p className="text-xs text-white/85 sm:text-sm">{site.tagline}</p>
          </div>

          {/* Search — present on every page of the live WordPress site */}
          <div className="w-full max-w-sm">
            <SearchBox compact />
          </div>

          <StarRating
            rating={reviewRating}
            count={reviewCount}
            href="https://www.google.com/search?q=Ideal+Roofing+System"
          />
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
