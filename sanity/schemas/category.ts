import { defineField, defineType } from 'sanity'

/**
 * Your WordPress install strips the /category/ base, so these archives live at
 * the site root: /blogs/, /projects/, /pvc/ and so on. The [slug] catch-all
 * route reproduces that exactly.
 */
export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title', maxLength: 200 },
      validation: (Rule) => Rule.required(),
      description: 'Served at the site root, e.g. /blogs/ - no /category/ prefix.',
    }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({ name: 'updatedAt', type: 'datetime' }),
    defineField({ name: 'legacyId', type: 'number', readOnly: true }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
