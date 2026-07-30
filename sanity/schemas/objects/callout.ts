import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'callout',
  title: 'Callout',
  type: 'object',
  fields: [
    defineField({
      name: 'tone',
      title: 'Tone',
      type: 'string',
      options: {
        list: [
          { title: 'Info', value: 'info' },
          { title: 'Tip', value: 'tip' },
          { title: 'Warning', value: 'warning' },
        ],
        layout: 'radio',
      },
      initialValue: 'info',
    }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block', styles: [{ title: 'Normal', value: 'normal' }] }],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'tone' },
  },
})
