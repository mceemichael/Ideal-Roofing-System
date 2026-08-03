import Script from 'next/script'
import { site } from '@/lib/site'

/**
 * The live site's Trustindex plugin renders real Google reviews on individual
 * posts (a genuine trust signal, missing entirely from the WordPress export
 * since it's plugin-rendered rather than stored post content). This is the
 * standalone embed snippet Michael provided from his Trustindex dashboard.
 *
 * Trustindex's loader mounts the widget into its own parent element — per
 * their own install docs the script tag must sit inside a wrapping <div>,
 * not bare. Without it the loader fetches the review data (confirmed via
 * network inspection) but has nowhere to render it, so nothing appears.
 */
export function TrustindexReviews() {
  return (
    <div>
      <Script id="trustindex-widget" strategy="afterInteractive" async src={site.trustindexWidgetSrc} />
    </div>
  )
}

export default TrustindexReviews
