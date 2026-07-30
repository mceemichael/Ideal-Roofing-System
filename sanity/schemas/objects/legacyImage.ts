import { defineField, defineType } from 'sanity'

/**
 * An image that may live in Sanity OR still be served from the old
 * /wp-content/uploads/ path.
 *
 * This dual nature is deliberate. Migrating 200 images into Sanity on day one
 * means 200 URLs changing at once, which puts your Google Images traffic at
 * risk during the exact window you can least afford it. Instead the importer
 * records the original URL, the rewrite in next.config.mjs keeps it resolving,
 * and you can move assets into Sanity gradually afterwards.
 */
export default defineType({
  name: 'legacyImage',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'asset',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'legacyUrl',
      title: 'Original WordPress URL',
      type: 'string',
      description:
        'Set by the migration script. Used when the asset has not been uploaded to Sanity yet. Do not edit by hand.',
      readOnly: true,
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description:
        'Describes the image for screen readers and Google Images. Genuinely worth filling in - your images rank.',
      validation: (Rule) =>
        Rule.warning('Alt text helps accessibility and image search rankings.'),
    }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'width', type: 'number', hidden: true }),
    defineField({ name: 'height', type: 'number', hidden: true }),
  ],
  preview: {
    select: { media: 'asset', title: 'alt', subtitle: 'legacyUrl' },
  },
})
