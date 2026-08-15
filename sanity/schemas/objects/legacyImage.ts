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
      description: 'Imported. Leave this alone.',
      readOnly: true,
      hidden: ({ parent }) => !parent?.legacyUrl,
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description:
        'Describe the photo in a few words (e.g. “Red longspan aluminium roof on a bungalow in Lagos”). Helps Google Images.',
      validation: (Rule) =>
        Rule.warning('Add a short description so this photo can rank in Google Images.'),
    }),
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({ name: 'width', type: 'number', hidden: true }),
    defineField({ name: 'height', type: 'number', hidden: true }),
  ],
  preview: {
    select: { media: 'asset', title: 'alt', subtitle: 'legacyUrl' },
  },
})
