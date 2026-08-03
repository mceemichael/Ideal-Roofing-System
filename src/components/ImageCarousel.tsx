'use client'

import { useEffect, useState } from 'react'
import { imageSrc } from '../../sanity/image'

type Slide = {
  image?: { asset?: unknown; legacyUrl?: string } | null
  alt?: string | null
  heading?: string | null
  description?: string | null
  buttonText?: string | null
  buttonLink?: string | null
}

/**
 * Live's Elementor "slides" promotional widget — product photo, optional
 * heading/description overlay, WhatsApp CTA. Self-built (no carousel
 * dependency) since this is the only place on the site that needs one.
 */
export function ImageCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0)
  const count = slides?.length || 0

  useEffect(() => {
    if (count < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 5000)
    return () => clearInterval(id)
  }, [count])

  if (!count) return null
  const slide = slides[index]
  const src = imageSrc(slide.image, 1200)

  return (
    <div
      className="relative my-8 aspect-[16/9] w-full overflow-hidden rounded-lg bg-black/20 sm:aspect-[21/9]"
      role="group"
      aria-roledescription="carousel"
      aria-label={slide.alt || 'Image carousel'}
    >
      {src ? (
        // Plain <img>, not next/image: the background fills the whole slide
        // via object-cover and swaps every few seconds, which doesn't suit
        // the optimizer's fixed-intrinsic-size model as well as a simple tag.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={slide.alt || ''}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-black/30" />

      {(slide.heading || slide.description || slide.buttonText) && (
        <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-10">
          {slide.heading ? (
            <p className="text-sm font-semibold uppercase tracking-wider text-white">
              {slide.heading}
            </p>
          ) : null}
          {slide.description ? (
            <p className="max-w-md text-lg font-bold leading-snug text-white sm:text-2xl">
              {slide.description}
            </p>
          ) : null}
          {slide.buttonText && slide.buttonLink ? (
            <a
              href={slide.buttonLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block w-fit rounded-lg border border-white px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {slide.buttonText}
            </a>
          ) : null}
        </div>
      )}

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
              <path d="M12.7 4.3 6.4 10l6.3 5.7 1.3-1.4L9.4 10l4.6-4.3-1.3-1.4Z" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => setIndex((i) => (i + 1) % count)}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-current">
              <path d="M7.3 4.3 13.6 10l-6.3 5.7-1.3-1.4L10.6 10 6 5.7l1.3-1.4Z" />
            </svg>
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={'Go to slide ' + (i + 1)}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={
                  'h-2 w-2 rounded-full transition-colors ' +
                  (i === index ? 'bg-white' : 'bg-white/40')
                }
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

export default ImageCarousel
