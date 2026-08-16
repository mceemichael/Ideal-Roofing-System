'use client'

import { useState } from 'react'
import Image from 'next/image'

/**
 * Click-to-load YouTube facade. A real embed loads ~850 KiB of player JS the
 * instant it's on the page — most of it unused unless the visitor actually
 * hits play. Showing the thumbnail and only mounting the iframe on click
 * keeps that weight off pages where the video sits unwatched.
 */
export function YouTubeEmbed({ id, title }: { id: string; title?: string }) {
  const [playing, setPlaying] = useState(false)
  const [thumb, setThumb] = useState(
    'https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg'
  )

  if (playing) {
    return (
      <iframe
        src={'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1'}
        title={title || 'YouTube video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={'Play video' + (title ? ': ' + title : '')}
      className="group absolute inset-0 h-full w-full"
    >
      <Image
        src={thumb}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 760px"
        className="object-cover"
        // Not every video has a maxres thumbnail; hqdefault always exists.
        onError={() => setThumb('https://i.ytimg.com/vi/' + id + '/hqdefault.jpg')}
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cta text-white shadow-float">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-1 h-7 w-7 fill-current">
            <path d="M8 5v14l11-7Z" />
          </svg>
        </span>
      </span>
    </button>
  )
}

export default YouTubeEmbed
