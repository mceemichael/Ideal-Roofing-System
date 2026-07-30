import Script from 'next/script'
import { site } from '@/lib/site'

/**
 * The live site's Trustindex plugin renders real Google reviews on individual
 * posts (a genuine trust signal, missing entirely from the WordPress export
 * since it's plugin-rendered rather than stored post content). This is the
 * standalone embed snippet Michael provided from his Trustindex dashboard —
 * it mounts its own widget on load, no host element required.
 */
export function TrustindexReviews() {
  return <Script id="trustindex-widget" strategy="afterInteractive" async src={site.trustindexWidgetSrc} />
}

export default TrustindexReviews
