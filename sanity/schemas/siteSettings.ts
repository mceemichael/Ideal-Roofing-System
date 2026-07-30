import { defineField, defineType } from 'sanity'

/**
 * Editable chrome. Anything genuinely fixed (verification codes, GTM ID,
 * canonical host) stays in src/lib/site.ts where it cannot be changed by
 * accident from the Studio.
 */
export default defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({
      name: 'defaultOgImage',
      title: 'Default social share image',
      type: 'legacyImage',
      description: 'Used when a post or page has no featured image. 1200x630 works best.',
    }),
    defineField({
      name: 'reviewCount',
      title: 'Google review count',
      type: 'number',
      description: 'Shown in the header. Update when it changes.',
    }),
    defineField({ name: 'reviewRating', title: 'Google rating', type: 'number' }),
    defineField({
      name: 'announcementBar',
      title: 'Announcement bar text',
      type: 'string',
      description: 'Leave empty to hide.',
    }),
    defineField({
      name: 'stats',
      title: 'Homepage stats',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'value', type: 'string', title: 'Value' },
            { name: 'label', type: 'string', title: 'Label' },
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})
