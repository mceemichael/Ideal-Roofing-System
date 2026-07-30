import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'youtube',
  title: 'YouTube video',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      title: 'YouTube URL',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Video title',
      type: 'string',
      description: 'Used for the iframe title and VideoObject structured data.',
    }),
    defineField({
      name: 'description',
      title: 'Video description',
      type: 'text',
      rows: 2,
      description: 'Feeds VideoObject schema. Your video sitemap uses this.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'url' },
    prepare({ title, subtitle }) {
      return { title: title || 'YouTube video', subtitle }
    },
  },
})
