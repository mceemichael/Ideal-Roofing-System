'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

/**
 * Sanity Studio, embedded at /studio.
 *
 * robots.ts disallows /studio/ and this exports noindex, so the CMS never
 * ends up in search results.
 */
export const dynamic = 'force-static'

export default function StudioPage() {
  return <NextStudio config={config} />
}
