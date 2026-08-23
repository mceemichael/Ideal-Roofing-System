'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { imageSrc } from '../../sanity/image'

export type RoofProjectPhoto = {
  asset?: unknown
  legacyUrl?: string
  alt?: string | null
  caption?: string | null
  width?: number | null
  height?: number | null
}

export type RoofProjectData = {
  family?: string | null
  postedAt?: string | null
  title?: string | null
  location?: string | null
  grade?: string | null
  showOnWebsite?: boolean | null
  photos?: RoofProjectPhoto[] | null
}

const PREVIEW_COUNT = 9
const EMPTY_SLOTS = 3

const FAMILY_ORDER = ['stonecoated', 'aluminium', 'paint'] as const

const FAMILY_HEADING: Record<(typeof FAMILY_ORDER)[number], string> = {
  stonecoated: 'Stone-coated roof designs',
  aluminium: 'Aluminium projects',
  paint: 'Roof paint projects',
}

function slugify(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function photoSrc(photo: RoofProjectPhoto, width: number) {
  return imageSrc(photo, width)
}

export function RoofProjectsGallery({ projects }: { projects: RoofProjectData[] }) {
  const groups = useMemo(() => {
    const listed = (projects || []).filter(
      (p) => p.showOnWebsite !== false && p.family !== 'unassigned'
    )
    return FAMILY_ORDER.map((family) => ({
      family,
      heading: FAMILY_HEADING[family],
      items: listed
        .map((p, index) => ({
          ...p,
          photos: (p.photos || []).filter((photo) => photoSrc(photo, 800)),
          _index: index,
        }))
        .filter((p) => (p.family || 'stonecoated') === family),
    })).filter((g) => g.items.length > 0)
  }, [projects])

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [lightbox, setLightbox] = useState<{ project: number; photo: number } | null>(
    null
  )

  const activeProject = lightbox ? flat[lightbox.project] : null
  const active =
    activeProject && lightbox ? activeProject.photos[lightbox.photo] : null
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox])

  function stepLightbox(delta: number) {
    setLightbox((current) => {
      if (!current) return current
      const photos = flat[current.project]?.photos || []
      if (!photos.length) return null
      const next = (current.photo + delta + photos.length) % photos.length
      return { project: current.project, photo: next }
    })
  }

  if (!groups.length) return null

  let runningIndex = -1

  return (
    <div className="mt-10 space-y-14">
      <nav aria-label="Roof designs" className="flex flex-wrap gap-2">
        {flat.map((project) => {
          const id = slugify(project.title)
          if (!id) return null
          return (
            <a
              key={id}
              href={'#' + id}
              className="rounded-full border border-white/30 px-3 py-1.5 text-sm text-white/85 transition-colors hover:border-white hover:text-white"
            >
              {project.title}
            </a>
          )
        })}
      </nav>

      {groups.map((group) => (
        <section key={group.family}>
          <h2 className="mb-6 text-2xl font-bold text-white sm:text-[1.75rem]">
            {group.heading}
          </h2>
          <div className="space-y-8">
            {group.items.map((project) => {
              runningIndex += 1
              const projectIndex = runningIndex
              const id = slugify(project.title) || 'design-' + projectIndex
              const photos = project.photos
              const isOpen = Boolean(expanded[id])
              const visible = isOpen ? photos : photos.slice(0, PREVIEW_COUNT)
              const hiddenCount = photos.length - visible.length

              return (
                <article
                  key={id}
                  id={id}
                  className="scroll-mt-32 rounded-xl border border-white/20 bg-white/10 p-4 sm:p-6"
                >
                  <header className="mb-4">
                    <h3 className="text-xl font-bold leading-snug text-white sm:text-2xl">
                      {project.title}
                    </h3>
                    {(project.location?.trim() || project.grade?.trim()) && (
                      <p className="mt-2 text-sm text-white/85">
                        {[project.location?.trim(), project.grade?.trim()]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </header>

                  {photos.length ? (
                    <>
                      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {visible.map((photo, photoIndex) => {
                          const src = photoSrc(photo, 800)
                          if (!src) return null
                          const alt =
                            photo.alt ||
                            (project.title || 'Roof') + ' project'
                          return (
                            <li key={src + photoIndex}>
                              <figure>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLightbox({
                                      project: projectIndex,
                                      photo: photoIndex,
                                    })
                                  }
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
                                {photo.caption ? (
                                  <figcaption className="mt-1.5 text-center text-xs leading-snug text-white/85">
                                    {photo.caption}
                                  </figcaption>
                                ) : null}
                              </figure>
                            </li>
                          )
                        })}
                      </ul>
                      {hiddenCount > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((prev) => ({ ...prev, [id]: true }))
                          }
                          className="mt-4 text-sm font-semibold text-white underline-offset-2 hover:underline"
                        >
                          Show all {photos.length} photos
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {Array.from({ length: EMPTY_SLOTS }).map((_, i) => (
                        <li
                          key={i}
                          className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-white/35 bg-white/5 px-3 text-center text-sm text-white/70"
                        >
                          {i === 0
                            ? 'Space for ' + (project.title || 'this design')
                            : '\u00a0'}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      ))}

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
          {activeProject && activeProject.photos.length > 1 ? (
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
            className="max-h-[90vh] max-w-5xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activeSrc}
              alt={active?.alt || 'Roof project photo'}
              width={active?.width || 1600}
              height={active?.height || 900}
              sizes="90vw"
              className="max-h-[82vh] w-auto rounded-lg object-contain"
            />
            {active?.caption ? (
              <p className="mt-3 text-sm text-white">{active.caption}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default RoofProjectsGallery
