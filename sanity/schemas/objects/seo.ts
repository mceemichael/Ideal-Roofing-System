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
  options: { collapsible: false },
  fieldsets: [
    {
      name: 'advanced',
      title: 'Advanced — leave these alone unless you are sure',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    defineField({
      name: 'focusKeyword',
      title: 'Focus keyword',
      type: 'string',
      description:
        'The phrase people type into Google, e.g. “price of aluminium roofing sheets in Lagos”. The SEO Analysis tab checks that this appears in the title, description, address and first paragraph.',
    }),
    defineField({
      name: 'title',
      title: 'Google title',
      type: 'string',
      description:
        'What Google shows as the blue link. 30–60 characters. If empty, the headline is used instead.',
      components: { input: SeoTitleInput },
      validation: (Rule) =>
        Rule.max(70).warning('Google cuts titles after about 60–70 characters.'),
    }),
    defineField({
      name: 'description',
      title: 'Google description',
      type: 'text',
      rows: 3,
      description:
        'The grey text under the link. 120–160 characters. Mention the focus keyword and a price or benefit.',
      components: { input: SeoDescriptionInput },
      validation: (Rule) =>
        Rule.max(200).warning('Google cuts descriptions after about 160 characters.'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Photo for WhatsApp / Facebook',
      type: 'legacyImage',
      description: 'If empty, the main photo is used.',
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL override',
      type: 'url',
      fieldset: 'advanced',
      description: 'Leave empty. Only for a deliberate duplicate of another page.',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide this page from Google',
      type: 'boolean',
      initialValue: false,
      fieldset: 'advanced',
      description:
        'Leave off. Turning this on removes the page from Google — the fastest way to lose a ranking.',
    }),
  ],
})
