import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

import { sanityFetch } from '../../sanity/client'
import { latestPostsQuery, siteSettingsQuery, pageBySlugQuery } from '../../sanity/queries'
import { site } from '@/lib/site'
import { buildMetadata } from '@/lib/seo'
import { graph, organizationSchema, websiteSchema } from '@/lib/schema'
import Container from '@/components/Container'
import PostCard, { type PostCardData } from '@/components/PostCard'
import PortableBody from '@/components/PortableBody'
import JsonLd from '@/components/JsonLd'

/**
 * Homepage. Section order matches the live WordPress page exactly — hero,
 * latest posts, about, stats, services, why-choose-us, reviews, team, CTA —
 * so returning visitors and Google both see the same information architecture.
 */

export const revalidate = 3600

export const metadata: Metadata = buildMetadata({
  path: '/',
  title: site.title,
  description: site.description,
})

const DEFAULT_STATS = [
  { value: '15+', label: 'Years In Business' },
  { value: '7k+', label: 'Happy Clients' },
  { value: '3.5k', label: 'Projects Completed' },
  { value: '150+', label: 'Trained Staff' },
]

const SERVICES = [
  {
    title: 'Roof Installations',
    href: '/services/',
    body: 'We specialize in expertly installing premium aluminium roofing sheets (lightweight, easy to handle, corrosion-resistant, and excellent for heat reflection) as well as stone-coated roofing sheets (like Gerard, Metrocopo, step-tiles, and longspan designs for timeless elegance and superior protection).',
    image: '/wp-content/uploads/2025/06/WhatsApp-Image-2025-06-24-at-175612_6e9167cc-1024x768.jpg',
    alt: 'Ideal Roofing System installers at work',
  },
  {
    title: 'Roof Corrugation and Supply',
    href: '/services/',
    body: 'At Ideal Roofing System, we specialize in the reliable supply of high-quality roofing sheets across Nigeria, focusing on premium aluminium roofing sheets and stone-coated roofing sheets to meet diverse building needs in Lagos, Osun, and beyond.',
    image: '/wp-content/uploads/2025/09/WhatsApp-Image-2025-09-01-at-163227_4c30d9d9.jpg',
    alt: 'Aluminium roofing sheet steptiles',
  },
  {
    title: 'Roof Repainting',
    href: '/roof-repainting-in-nigeria/',
    body: 'At Ideal Roofing System, while we primarily focus on supplying and installing premium new roofing solutions like aluminium and stone-coated sheets (which are designed for long-term durability and low maintenance), we understand that many homeowners in Nigeria deal with older roofs that may need refreshing through repainting or protective coating to extend lifespan, improve aesthetics, and combat fading, corrosion, or weathering.',
    image: '/wp-content/uploads/2026/03/IMG-20260227-WA0001-768x1024.jpg',
    alt: 'Roof repainting by Ideal Roofing System',
  },
]

const REASONS = [
  // Wording matches the live site exactly, including its "intergrity" typo —
  // this is hardcoded homepage copy, not CMS content, so there is nowhere
  // else to fix it; leave it to Michael to correct in a future content pass.
  { title: 'Quality Material', body: 'Certified by SON, our materials are made of the highest standards and have undergone rigorous intergrity tests' },
  { title: 'Accredited', body: site.business.registrationNumber },
  { title: 'Trained Workers', body: 'We pride ourselves on utmost professionalism.' },
  { title: 'Time Availability', body: 'Do you need the project to be completed with speed and accuracy? We provide reliable hands' },
  { title: 'Quick Response', body: 'We are always ready to pick your call or respond to your whatsapp' },
  { title: '1 Year Warranty', body: 'We Offer 1 year warranty against leakage on all roofing project completed by us' },
]

const ADDITIONAL = [
  'Warehouse Roofing',
  'Window Replacement and Construction',
  'Roof Repainting',
  'Thunder Arrestor Installation',
  'PVC Rain Gutter Installation and Supply',
]

export default async function HomePage() {
  const [posts, settings, homePage] = await Promise.all([
    sanityFetch<PostCardData[]>({
      query: latestPostsQuery,
      params: { limit: 3 },
      tags: ['post'],
    }).catch(() => [] as PostCardData[]),
    sanityFetch<any>({ query: siteSettingsQuery, tags: ['siteSettings'] }).catch(() => null),
    // If you keep an editable body on the WP home page, it renders here.
    sanityFetch<any>({ query: pageBySlugQuery, params: { slug: 'home' } }).catch(() => null),
  ])

  const stats = settings?.stats?.length ? settings.stats : DEFAULT_STATS

  return (
    <>
      <JsonLd data={graph(organizationSchema(), websiteSchema())} />

      {/* Hero ------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-12 text-center sm:py-16">
          <p className="text-sm font-medium text-brand">
            Trusted By Over 2000+ Engineers and 7000 clients nationwide
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-5xl">
            Nigeria&rsquo;s Leading Roofing Company
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
            {site.description}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pricelist/"
              className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              See Updated Pricelist
            </Link>
            <a
              href={site.social.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-brand px-6 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand-50"
            >
              Get a Free Quote
            </a>
          </div>
        </Container>
      </section>

      {/* Latest posts ----------------------------------------------- */}
      {posts.length ? (
        <Container className="py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              Latest Prices &amp; Guides
            </h2>
            <Link
              href="/blogs-and-projects/"
              className="shrink-0 text-sm font-semibold text-brand hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p, i) => (
              <PostCard key={p._id} post={p} priority={i === 0} />
            ))}
          </div>
        </Container>
      ) : null}

      {/* About ------------------------------------------------------ */}
      <section className="bg-surface-soft py-14">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">About Company</h2>
            <p className="mt-4 leading-relaxed text-ink-muted">
              Ideal Roofing System is a trusted leader in Nigeria&rsquo;s roofing
              industry, specializing in the supply, sales, and professional
              installation of high-quality roofing solutions. Founded in{' '}
              {site.founded} and headquartered in {site.business.addressLocality},
              Lagos, we have built a strong reputation over
              the years as your go-to source for premium aluminium roofing sheets,
              stone-coated roofing sheets (including popular options like Gerard,
              Metrocopo, step-tiles, and longspan), along with accessories, rain
              gutters (PVC water collectors), and related services.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand">
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
                <path d="M10 1.5 12.2 6l5 .7-3.6 3.5.85 4.95L10 12.8l-4.45 2.35.85-4.95L2.8 6.7l5-.7L10 1.5Z" />
              </svg>
              Certified Company
            </p>
            <div className="mt-6">
              <Link
                href="/about-us/"
                className="inline-block rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
              >
                READ MORE
              </Link>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <Image
              src="/wp-content/uploads/2026/03/20250605_163207-225x300.jpg"
              alt="Ideal Roofing System workers"
              width={900}
              height={600}
              sizes="(max-width: 1024px) 100vw, 540px"
              className="h-auto w-full rounded-xl object-cover"
            />
          </div>
        </Container>
      </section>

      {/* Stats ------------------------------------------------------ */}
      <section className="bg-brand py-12 text-white">
        <Container>
          <dl className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
            {stats.map((s: { value: string; label: string }) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block text-3xl font-bold sm:text-4xl">{s.value}</span>
                  <span className="mt-1 block text-sm text-white/80">{s.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Services --------------------------------------------------- */}
      <Container className="py-14">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Our Services
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            We Provide Superior Roofing Services
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {SERVICES.map((s) => (
            <article
              key={s.title}
              className="flex flex-col overflow-hidden rounded-xl border border-surface-border bg-white shadow-card"
            >
              <Image
                src={s.image}
                alt={s.alt}
                width={800}
                height={600}
                sizes="(max-width: 768px) 100vw, 360px"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold text-ink">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                  {s.body}
                </p>
                <Link
                  href={s.href}
                  className="mt-4 text-sm font-semibold text-brand hover:underline"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-surface-soft p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">
            Additional Services
          </p>
          <h3 className="mt-1 text-xl font-bold text-ink">We Also Offer</h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ADDITIONAL.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink-muted">
                <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 fill-brand">
                  <path d="M8.2 13.4 4.8 10l1.4-1.4 2 2 5-5L14.6 7l-6.4 6.4Z" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/services/"
            className="mt-5 inline-block rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Know More
          </Link>
        </div>
      </Container>

      {/* Why choose us ---------------------------------------------- */}
      <section className="bg-surface-soft py-14">
        <Container>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-brand">
              Why Choose Us
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              Six Reasons For People Choosing Us
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map((r) => (
              <div key={r.title} className="rounded-xl bg-white p-5 shadow-card">
                <h3 className="font-semibold text-ink">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{r.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Reviews ---------------------------------------------------- */}
      <Container className="py-14 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">
          We Are Business Who Cares, And it Shows
        </p>
        <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
          OVER 100 &ldquo;5 STARS&rdquo; REVIEWS AND CLIMBING
        </h2>

        <div className="mx-auto mt-8 grid max-w-2xl gap-6 sm:grid-cols-2">
          <a
            href={site.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-surface-border p-6 transition-shadow hover:shadow-card-hover"
          >
            <p className="font-semibold text-ink">Rate Us on Google</p>
            <p className="mt-1 text-sm text-ink-muted">128 reviews</p>
          </a>
          <a
            href={site.facebookReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-surface-border p-6 transition-shadow hover:shadow-card-hover"
          >
            <p className="font-semibold text-ink">Rate Us on Facebook</p>
            <p className="mt-1 text-sm text-ink-muted">24 reviews</p>
          </a>
        </div>
      </Container>

      {/* Editable body from Sanity, if a "home" page exists ---------- */}
      {homePage?.body ? (
        <Container className="pb-14">
          <div className="mx-auto max-w-prose">
            <PortableBody value={homePage.body} />
          </div>
        </Container>
      ) : null}

      {/* Final CTA -------------------------------------------------- */}
      <section className="bg-brand py-14 text-white">
        <Container className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-white/80">
            Don&rsquo;t Know What To Start With?
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Get A Solution For All Roofing Services
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={site.social.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand-50"
            >
              Talk to us on WhatsApp
            </a>
            <Link
              href="/roof-area-calculator/"
              className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Roof Area Calculator
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
