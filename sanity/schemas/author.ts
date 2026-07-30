import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'name', maxLength: 100 },
      validation: (Rule) => Rule.required(),
      description: 'Served at /author/<slug>/ - e.g. mcmichael, ruth.',
    }),
    defineField({ name: 'role', title: 'Role / job title', type: 'string' }),
    defineField({ name: 'bio', type: 'text', rows: 4 }),
    defineField({ name: 'avatar', type: 'legacyImage' }),
    defineField({
      name: 'avatarUrl',
      title: 'Gravatar URL',
      type: 'url',
      description: 'Imported from WordPress. Used if no avatar image is uploaded.',
    }),
    defineField({ name: 'legacyId', type: 'number', readOnly: true }),
  ],
  preview: { select: { title: 'name', subtitle: 'role', media: 'avatar.asset' } },
})
