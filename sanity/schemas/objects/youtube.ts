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
      description: 'A short name for the video. Shown to screen readers and Google.',
    }),
    defineField({
      name: 'description',
      title: 'Video description',
      type: 'text',
      rows: 2,
      description: 'Optional. One sentence about what the video shows.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'url' },
    prepare({ title, subtitle }) {
      return { title: title || 'YouTube video', subtitle }
    },
  },
})
