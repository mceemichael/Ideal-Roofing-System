import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title', maxLength: 200 },
      validation: (Rule) => Rule.required(),
      description: 'Served at /tag/<slug>/',
    }),
    defineField({ name: 'description', type: 'text', rows: 2 }),
    defineField({ name: 'updatedAt', type: 'datetime' }),
    defineField({ name: 'legacyId', type: 'number', readOnly: true }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
