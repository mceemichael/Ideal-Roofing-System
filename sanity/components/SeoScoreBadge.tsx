import type { DocumentBadgeComponent, DocumentBadgeProps } from 'sanity'
import { computeSeoScore, scoreColor, scoreLabel } from '../lib/seoScore'

/**
 * Small "SEO: 80% Good" badge next to the Published/Draft status at the top
 * of a post/page — the at-a-glance signal Michael asked for, visible
 * without opening the "SEO Analysis" tab at all.
 */
export const SeoScoreBadge: DocumentBadgeComponent = (props: DocumentBadgeProps) => {
  const doc = (props.draft || props.published) as any
  if (!doc) return null

  const result = computeSeoScore(doc)

  return {
    label: 'SEO: ' + result.score + '% ' + scoreLabel(result.score),
    color: scoreColor(result.score),
  }
}
