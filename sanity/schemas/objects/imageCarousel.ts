import { defineField, defineType } from 'sanity'

/**
 * A promotional image slider — live's Elementor "slides" widget, used on the
 * pricelist posts to showcase product photos with a heading/description and
 * an "Order Here" WhatsApp button. The importer couldn't confidently convert
 * this widget type, so it fell into `htmlEmbed` as bare link text with the
 * background images dropped entirely (Elementor sets them via a scoped
 * stylesheet, not markup the importer walks). Rebuilt as a real block type
 * once the live slide data was pulled by hand.
 */
export default defineType({
  name: 'imageCarousel',
  title: 'Image carousel',
  type: 'object',
  fields: [
    defineField({
      name: 'slides',
      title: 'Slides',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'slide',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'object',
              fields: [
                defineField({ name: 'asset', title: 'Image', type: 'image', options: { hotspot: true } }),
                defineField({
                  name: 'legacyUrl',
                  title: 'Original WordPress URL',
                  type: 'string',
                  readOnly: true,
                }),
              ],
            }),
            defineField({ name: 'alt', title: 'Alt text', type: 'string' }),
            defineField({ name: 'heading', title: 'Heading', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'string' }),
            defineField({ name: 'buttonText', title: 'Button text', type: 'string' }),
            defineField({ name: 'buttonLink', title: 'Button link (e.g. WhatsApp)', type: 'url' }),
          ],
          preview: {
            select: { title: 'heading', subtitle: 'description', media: 'image.asset' },
          },
        },
      ],
      validation: (Rule) => Rule.min(1),
    }),
  ],
  preview: {
    select: { slides: 'slides' },
    prepare({ slides }) {
      return { title: 'Image carousel', subtitle: (slides?.length || 0) + ' slide(s)' }
    },
  },
})
