'use client'

import { useEffect, useState } from 'react'
import { site } from '@/lib/site'

/**
 * The live site's Trustindex plugin renders real Google reviews on individual
 * posts (a genuine trust signal, missing entirely from the WordPress export
 * since it's plugin-rendered rather than stored post content).
 *
 * Rendered as an iframe rather than the documented <script> install: the
 * script tag (with or without a wrapping element) fetches review data
 * successfully but never renders anything, for reasons not worth chasing
 * once this worked instead. Confirmed rendering real reviews via a bare
 * iframe pointed at Trustindex's own embed page.
 *
 * The page posts its content height via postMessage (it's built for AMP's
 * auto-resize, but the message works the same outside AMP) — listening for
 * it avoids guessing a fixed height that clips or leaves dead space.
 */
export function TrustindexReviews() {
  const [height, setHeight] = useState(303)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (
        e.origin === 'https://cdn.trustindex.io' &&
        e.data?.sentinel === 'amp' &&
        e.data?.type === 'embed-size' &&
        typeof e.data.height === 'number'
      ) {
        setHeight(e.data.height)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <iframe
      src={site.trustindexWidgetIframeSrc}
      title="Customer reviews"
      loading="lazy"
      style={{ height }}
      className="w-full border-0"
    />
  )
}

export default TrustindexReviews
