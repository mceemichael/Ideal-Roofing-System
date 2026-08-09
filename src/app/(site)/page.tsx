import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

import { sanityFetch } from '../../../sanity/client'
import { latestPostsQuery, siteSettingsQuery } from '../../../sanity/queries'
import { site } from '@/lib/site'
import { buildMetadata } from '@/lib/seo'
import { graph, organizationSchema, websiteSchema } from '@/lib/schema'
import { cn } from '@/lib/cn'
import Container from '@/components/Container'
import PostCard, { type PostCardData } from '@/components/PostCard'
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
    image: '/wp-content/uploads/2026/08/roof-installation-project-watermarked-v2.jpg',
    alt: 'Ideal Roofing System stone-coated roof installation project',
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
  { title: 'Quality Material', body: 'Certified by SON, our materials are made of the highest standards and have undergone rigorous integrity tests' },
  { title: 'Accredited', body: site.business.registrationNumber },
  { title: 'Trained Workers', body: 'We pride ourselves on utmost professionalism.' },
  { title: 'Time Availability', body: 'Do you need the project to be completed with speed and accuracy? We provide reliable hands' },
  { title: 'Quick Response', body: 'We are always ready to pick your call or respond to your WhatsApp' },
  { title: '1 Year Warranty', body: 'We Offer 1 year warranty against leakage on all roofing projects completed by us' },
]

const ADDITIONAL = [
  'Warehouse Roofing',
  'Window Replacement and Construction',
  'Roof Repainting',
  'Thunder Arrestor Installation',
  'PVC Rain Gutter Installation and Supply',
]

// Staff testimonials — live homepage's "People Say The Nicest Things"
// section (three named staff, star rating, quote). Hardcoded homepage copy
// like SERVICES/REASONS above, not CMS content. Ratings rounded to whole
// stars (live shows 4.5/4/4.5) since the star icon here has no half-fill state.
const TEAM = [
  {
    name: 'Michael Chibuzo',
    role: 'Sales Manager',
    rating: 5,
    quote:
      'I am not just interested in selling you our products, I am very much interested in listening to your needs and ensuring you get the very best of services',
    image: '/wp-content/uploads/2026/03/20250605_154718-scaled-e1772790568389.jpg',
  },
  {
    name: 'Adeshina Olabamiji',
    role: 'Site Project Manager',
    rating: 4,
    quote: 'I and my team are dedicated to provide you with the best roofing experience',
    image: '/wp-content/uploads/2026/03/IMG-20260310-WA0012-1536x2048.jpg',
  },
  {
    name: 'Chinaza Ezeh',
    role: 'Social Media Manager',
    rating: 5,
    quote:
      'Check us out on TikTok, Facebook, and YouTube… I post our best projects on Instagram and Pinterest. All @idealroofingsystem',
    image: '/wp-content/uploads/2026/03/IMG-20220808-WA0025.jpg',
  },
]

export default async function HomePage() {
  const [posts, settings] = await Promise.all([
    sanityFetch<PostCardData[]>({
      query: latestPostsQuery,
      params: { limit: 3 },
      tags: ['post'],
    }).catch(() => [] as PostCardData[]),
    sanityFetch<any>({ query: siteSettingsQuery, tags: ['siteSettings'] }).catch(() => null),
  ])

  const stats = settings?.stats?.length ? settings.stats : DEFAULT_STATS

  return (
    <>
      <JsonLd data={graph(organizationSchema(), websiteSchema())} />

      {/* Video -------------------------------------------------------
          First thing on the live homepage, right after the header. Self-
          hosted, not YouTube — matches the live <video> element exactly
          (same attributes), proxied through /wp-content/uploads/* like
          every other legacy asset. Live renders this inside Elementor's
          boxed container (~1140px max width), not edge-to-edge — confirmed
          via computed styles on the live page (video width 1120px inside a
          1140px `e-con-boxed`, i.e. 10px padding each side — Elementor's
          own container padding, not `Container`'s default 16-24px). Reusing
          `Container`'s max-w-content but overriding its padding to match;
          without the override this rendered at 1092px, visibly smaller than
          live's 1120px at desktop widths. */}
      <Container className="!px-2.5">
        {/* Video source points straight at Blob storage rather than through
            the /wp-content/uploads/ rewrite: the rewrite's edge cache doesn't
            vary by Range header, so a real visitor's browser seeking the video
            (which sends Range requests) can get its response cached and served
            to every later visitor regardless of what range they asked for —
            observed in production, not hypothetical. Blob's own URL serves
            Range requests correctly. Poster is a plain GET (no Range), so it's
            unaffected and stays on the rewrite. -v2 filenames: some CDN edges
            cached the post-cutover 508 error under the original paths with a
            200 status and 30-day TTL; original paths still resolve fine for
            any external hotlinks, just no longer referenced here. */}
        <video
          poster="/wp-content/uploads/2026/04/919908-768x639-v2.jpg"
          autoPlay
          controls
          playsInline
          controlsList="nodownload"
          preload="none"
          className="aspect-video w-full"
        >
          <source
            src={`${process.env.MEDIA_ORIGIN}/wp-content/uploads/2026/04/2026-04-04-201337262-v2.mp4#t=0`}
          />
        </video>
      </Container>

      {/* Latest posts -------------------------------------------------
          Immediately after the video, matching the live homepage's actual
          order — there's no hero section between them on live. */}
      {posts.length ? (
        <Container className="py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Latest Prices &amp; Guides
            </h2>
            <Link
              href="/blogs-and-projects/"
              className="shrink-0 text-sm font-semibold text-white hover:underline"
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

      {/* Hero ------------------------------------------------------- */}
      <section>
        <Container className="py-12 text-center sm:py-16">
          {/* H2, not H1 — the site's single H1 lives in the header. */}
          <h2 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-5xl">
            Nigeria&rsquo;s Leading Roofing Company
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            {site.description}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pricelist/"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-secondary transition-colors hover:bg-white/90"
            >
              See Updated Pricelist
            </Link>
            <a
              href={site.social.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Get a Free Quote
            </a>
          </div>
        </Container>
      </section>

      {/* About ------------------------------------------------------ */}
      <section className="py-14">
        <Container className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">About Company</h2>
            <p className="mt-4 leading-relaxed text-white/85">
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
            <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
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
            {/* Real source is portrait (768x1024/225x300, not 900x600) —
                without an explicit aspect ratio, the browser's real
                dimensions win over the (wrong) width/height props once
                w-full/h-auto are applied, rendering far taller than
                intended on desktop's wider column. aspect-[4/3] + object-cover
                keeps this proportionate at every viewport width, matching
                how the services images below already handle the same issue. */}
            <Image
              src="/wp-content/uploads/2026/03/20250605_163207-768x1024.jpg"
              alt="Ideal Roofing System workers"
              width={768}
              height={1024}
              sizes="(max-width: 1024px) 100vw, 540px"
              className="aspect-[4/3] w-full rounded-xl object-cover"
            />
          </div>
        </Container>
      </section>

      {/* Stats ------------------------------------------------------ */}
      <section className="py-12 text-white">
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
          <p className="text-sm font-semibold uppercase tracking-wider text-white">
            Our Services
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            We Provide Superior Roofing Services
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {SERVICES.map((s) => (
            <article key={s.title} className="flex flex-col">
              <Image
                src={s.image}
                alt={s.alt}
                width={800}
                height={600}
                sizes="(max-width: 768px) 100vw, 360px"
                className="aspect-[4/3] w-full rounded-xl object-cover"
              />
              <div className="flex flex-1 flex-col pt-4">
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/85">
                  {s.body}
                </p>
                <Link
                  href={s.href}
                  className="mt-4 text-sm font-semibold text-white hover:underline"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-xl bg-white/10 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-white">
            Additional Services
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">We Also Offer</h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {ADDITIONAL.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/85">
                <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 fill-white">
                  <path d="M8.2 13.4 4.8 10l1.4-1.4 2 2 5-5L14.6 7l-6.4 6.4Z" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/services/"
            className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-600"
          >
            Know More
          </Link>
        </div>
      </Container>

      {/* Why choose us ---------------------------------------------- */}
      <section className="py-14">
        <Container>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-white">
              Why Choose Us
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Six Reasons For People Choosing Us
            </h2>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {REASONS.map((r) => (
              <div key={r.title} className="text-center sm:text-left">
                <h3 className="font-semibold text-white">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/85">{r.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Reviews ---------------------------------------------------- */}
      <Container className="py-14 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-white">
          We Are Business Who Cares, And it Shows
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
          OVER 100 &ldquo;5 STARS&rdquo; REVIEWS AND CLIMBING
        </h2>

        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:gap-6">
          <a
            href={site.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-white/20 p-3 text-left transition-colors hover:bg-white/10 sm:gap-4 sm:p-6"
          >
            <svg viewBox="0 0 48 48" aria-hidden="true" className="h-7 w-7 shrink-0 sm:h-10 sm:w-10">
              <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3C33.7 32 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 5.9 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5Z" />
              <path fill="#FF3D00" d="m6.3 14.7 6 4.4C14 15.4 18.6 12 24 12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 5.9 29.2 4 24 4c-7.5 0-14 4.2-17.7 10.7Z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.4 26.7 36 24 36c-5.3 0-9.7-3-11.4-7.3l-6.2 4.8C10 39.7 16.4 44 24 44Z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.9 35.8 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5Z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-white sm:text-base">Rate Us on Google</p>
              <p className="mt-1 text-xs text-white/85 sm:text-sm">128 reviews</p>
            </div>
          </a>
          <a
            href={site.facebookReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-white/20 p-3 text-left transition-colors hover:bg-white/10 sm:gap-4 sm:p-6"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 shrink-0 fill-[#1877F2] sm:h-10 sm:w-10">
              <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-white sm:text-base">Rate Us on Facebook</p>
              <p className="mt-1 text-xs text-white/85 sm:text-sm">24 reviews</p>
            </div>
          </a>
        </div>
      </Container>

      {/* Team testimonials -------------------------------------------
          Live's "People Say The Nicest Things" section, right after the
          Google/Facebook review badges and before the final CTA. */}
      <Container className="py-14 text-center">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          People Say The Nicest Things
        </h2>
        <p className="mt-2 text-white/85">
          Do not just take our words, google what clients are saying
        </p>

        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {TEAM.map((member) => (
            <div key={member.name}>
              <Image
                src={member.image}
                alt={member.name + ' (' + member.role + ')'}
                width={600}
                height={800}
                sizes="(max-width: 640px) 60vw, 300px"
                className="mx-auto aspect-[3/4] w-full max-w-[260px] rounded-xl object-cover"
              />
              <div
                className="mt-4 flex items-center justify-center gap-1"
                role="img"
                aria-label={'Rated ' + member.rating + ' out of 5'}
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <svg
                    key={i}
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className={cn('h-4 w-4', i < member.rating ? 'fill-accent' : 'fill-white/20')}
                  >
                    <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.36 4.18a1 1 0 00.95.69h4.4c.97 0 1.37 1.24.59 1.81l-3.56 2.59a1 1 0 00-.36 1.12l1.36 4.18c.3.92-.75 1.69-1.54 1.12l-3.56-2.59a1 1 0 00-1.18 0l-3.56 2.59c-.78.57-1.83-.2-1.53-1.12l1.36-4.18a1 1 0 00-.37-1.12L1.75 9.61c-.78-.57-.38-1.81.59-1.81h4.4a1 1 0 00.95-.69l1.36-4.18Z" />
                  </svg>
                ))}
              </div>
              <p className="mt-3 font-semibold text-white">{member.name}</p>
              <p className="text-sm text-white/80">{member.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/85">{member.quote}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* Final CTA -------------------------------------------------- */}
      <section className="py-14 text-white">
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
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-secondary transition-colors hover:bg-white/90"
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
