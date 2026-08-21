import { defineField, defineType } from 'sanity'

/**
 * One completed roof job on /roofprojects/. Photos are grouped by the date
 * they were taken. Name, site location and grade stay empty until labelled
 * in Studio — empty fields are hidden on the public page.
 */
export default defineType({
  name: 'roofProject',
  title: 'Roof project',
  type: 'object',
  fields: [
    defineField({
      name: 'postedAt',
      title: 'Date photographed',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Project name',
      type: 'string',
      description: 'e.g. Aluminium Longspan Project. Leave blank until you know.',
    }),
    defineField({
      name: 'location',
      title: 'Site location',
      type: 'string',
      description: 'e.g. Ikorodu, Lagos. Leave blank until you know.',
    }),
    defineField({
      name: 'grade',
      title: 'Grade',
      type: 'string',
      description: 'e.g. Caliper, 0.55mm, Bond. Leave blank until you know.',
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [{ type: 'legacyImage' }],
      validation: (Rule) => Rule.min(1),
    }),
  ],
  preview: {
    select: { title: 'title', date: 'postedAt', photos: 'photos' },
    prepare({ title, date, photos }) {
      const count = Array.isArray(photos) ? photos.length : 0
      return {
        title: title || 'Unlabelled project',
        subtitle: [date, count ? count + ' photo' + (count === 1 ? '' : 's') : null]
          .filter(Boolean)
          .join(' · '),
        media: photos?.[0]?.asset,
      }
    },
  },
})
