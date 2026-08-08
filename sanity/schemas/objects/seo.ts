import { defineField, defineType } from 'sanity'
import { SeoDescriptionInput } from '../../components/SeoDescriptionInput'
import { SeoTitleInput } from '../../components/SeoTitleInput'

/**
 * Mirrors the Rank Math fields from WordPress one-for-one.
 *
 * These values are what Google currently displays in the SERPs. The migration
 * script copies them across verbatim. Editing them post-migration is fine -
 * but do it deliberately, one page at a time, not as a batch.
 */
export default defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: false },
  fields: [
    defineField({
      name: 'title',
      title: 'Meta title',
      type: 'string',
      description:
        'Overrides the page title in search results. Imported from Rank Math. Aim for under 60 characters.',
      components: { input: SeoTitleInput },
      validation: (Rule) =>
        Rule.max(70).warning('Titles over ~70 characters get truncated in Google.'),
    }),
    defineField({
      name: 'description',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'Imported from Rank Math. Aim for 140-160 characters.',
      components: { input: SeoDescriptionInput },
      validation: (Rule) =>
        Rule.max(200).warning('Descriptions over ~160 characters get truncated.'),
    }),
    defineField({
      name: 'focusKeyword',
      title: 'Focus keyword',
      type: 'string',
      description: 'Carried over from Rank Math for your reference. Not output in HTML.',
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL override',
      type: 'url',
      description:
        'Leave empty in almost all cases. Only set this if this page is a deliberate duplicate of another URL.',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
      description:
        'Emits noindex. Use sparingly - a wrongly-set noindex is the single fastest way to lose a page from Google.',
    }),
    defineField({
      name: 'ogImage',
      title: 'Social share image',
      type: 'legacyImage',
      description: 'Falls back to the featured image, then the site default.',
    }),
  ],
})
