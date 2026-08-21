'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { imageSrc } from '../../sanity/image'
import { formatLongDate } from '@/lib/format'
import { cn } from '@/lib/cn'

export type RoofProjectPhoto = {
  asset?: unknown
  legacyUrl?: string
  alt?: string | null
  caption?: string | null
  width?: number | null
  height?: number | null
}

export type RoofProjectData = {
  postedAt?: string | null
  title?: string | null
  location?: string | null
  grade?: string | null
  photos?: RoofProjectPhoto[] | null
}

const PREVIEW_COUNT = 9

function LabelSlot({ label, value }: { label: string; value?: string | null }) {
  const filled = Boolean(value?.trim())
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-white/70">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 min-h-[1.5rem]',
          filled ? 'text-white' : 'border-b border-dashed border-white/35 text-transparent'
        )}
      >
        {filled ? value : '\u00a0'}
      </dd>
    </div>
  )
}

function photoSrc(photo: RoofProjectPhoto, width: number) {
  return imageSrc(photo, width)
}

export function RoofProjectsGallery({ projects }: { projects: RoofProjectData[] }) {
  const list = useMemo(
    () =>
      (projects || [])
        .map((p) => ({
          ...p,
          photos: (p.photos || []).filter((photo) => photoSrc(photo, 800)),
        }))
        .filter((p) => p.photos.length > 0),
    [projects]
  )

  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [lightbox, setLightbox] = useState<{ project: number; photo: number } | null>(
    null
  )

  const active =
    lightbox && list[lightbox.project]
      ? list[lightbox.project].photos[lightbox.photo]
      : null
  const activeSrc = active ? photoSrc(active, 1920) : null

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') stepLightbox(1)
      if (e.key === 'ArrowLeft') stepLightbox(-1)
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
    // stepLightbox is stable enough for this effect; lightbox identity is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox])

  function stepLightbox(delta: number) {
    setLightbox((current) => {
      if (!current) return current
      const photos = list[current.project]?.photos || []
      if (!photos.length) return null
      const next = (current.photo + delta + photos.length) % photos.length
      return { project: current.project, photo: next }
    })
  }

  if (!list.length) return null

  return (
    <div className="mt-10 space-y-10">
      {list.map((project, projectIndex) => {
        const photos = project.photos
        const isOpen = Boolean(expanded[projectIndex])
        const visible = isOpen ? photos : photos.slice(0, PREVIEW_COUNT)
        const hiddenCount = photos.length - visible.length
        const heading = project.title?.trim() || formatLongDate(project.postedAt)
        const hasMeta = Boolean(project.location?.trim() || project.grade?.trim())

        return (
          <article
            key={(project.postedAt || '') + '-' + projectIndex}
            className="rounded-xl border border-white/20 bg-white/10 p-4 sm:p-6"
          >
            <header className="mb-4">
              {project.postedAt ? (
                <time
                  dateTime={project.postedAt}
                  className="text-xs font-semibold uppercase tracking-wider text-white/85"
                >
                  {formatLongDate(project.postedAt)}
                </time>
              ) : null}

              {project.title?.trim() ? (
                <h3 className="mt-1 text-xl font-bold leading-snug text-white sm:text-2xl">
                  {heading}
                </h3>
              ) : (
                <h3 className="mt-1 text-xl font-bold leading-snug text-white sm:text-2xl">
                  Roof project
                </h3>
              )}

              <dl className="mt-3 grid gap-3 text-sm text-white/85 sm:grid-cols-3">
                <LabelSlot label="Project" value={project.title} />
                <LabelSlot label="Site location" value={project.location} />
                <LabelSlot label="Grade" value={project.grade} />
              </dl>
              {!project.title?.trim() && !hasMeta ? (
                <p className="sr-only">Project name, site location and grade to be labelled.</p>
              ) : null}
            </header>

            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {visible.map((photo, photoIndex) => {
                const src = photoSrc(photo, 800)
                if (!src) return null
                const alt =
                  photo.alt ||
                  project.title?.trim() ||
                  'Roof project photographed ' + formatLongDate(project.postedAt)
                return (
                  <li key={src + photoIndex}>
                    <button
                      type="button"
                      onClick={() => setLightbox({ project: projectIndex, photo: photoIndex })}
                      className="group block w-full overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <Image
                        src={src}
                        alt={alt}
                        width={photo.width || 800}
                        height={photo.height || 533}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 360px"
                        className="aspect-[4/3] h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </button>
                  </li>
                )
              })}
            </ul>

            {hiddenCount > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [projectIndex]: true }))
                }
                className="mt-4 text-sm font-semibold text-white underline-offset-2 hover:underline"
              >
                Show all {photos.length} photos
              </button>
            ) : null}
          </article>
        )
      })}

      {lightbox && activeSrc ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Project photo"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/25"
            onClick={() => setLightbox(null)}
          >
            Close
          </button>
          {list[lightbox.project].photos.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg bg-white/15 px-3 py-2 text-white hover:bg-white/25 sm:left-6"
                onClick={(e) => {
                  e.stopPropagation()
                  stepLightbox(-1)
                }}
                aria-label="Previous photo"
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-white/15 px-3 py-2 text-white hover:bg-white/25 sm:right-6"
                onClick={(e) => {
                  e.stopPropagation()
                  stepLightbox(1)
                }}
                aria-label="Next photo"
              >
                ›
              </button>
            </>
          ) : null}
          <div
            className="max-h-[90vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeSrc}
              alt={active?.alt || 'Roof project photo'}
              width={active?.width || 1600}
              height={active?.height || 900}
              sizes="90vw"
              className="max-h-[90vh] w-auto rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default RoofProjectsGallery
