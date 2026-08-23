import { defineField, defineType } from 'sanity'

/**
 * One design gallery on /projects/ — e.g. Shingle, Milano, Aluminium.
 * Empty photo lists are allowed so the website can show a reserved slot
 * before pictures are added.
 */
export default defineType({
  name: 'roofProject',
  title: 'Roof design',
  type: 'object',
  fields: [
    defineField({
      name: 'family',
      title: 'Group',
      type: 'string',
      options: {
        list: [
          { title: 'Stone-coated', value: 'stonecoated' },
          { title: 'Aluminium', value: 'aluminium' },
          { title: 'Roof paint', value: 'paint' },
          { title: 'Unassigned (hidden on the website)', value: 'unassigned' },
        ],
        layout: 'radio',
      },
      initialValue: 'stonecoated',
    }),
    defineField({
      name: 'title',
      title: 'Design name',
      type: 'string',
      description: 'e.g. Shingle, Milano, Bond, Aluminium.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Site location',
      type: 'string',
      description: 'Optional. e.g. Ikorodu, Lagos. Hidden on the website if blank.',
    }),
    defineField({
      name: 'grade',
      title: 'Grade',
      type: 'string',
      description: 'Optional. e.g. 0.55mm. Hidden on the website if blank.',
    }),
    defineField({
      name: 'postedAt',
      title: 'Date (optional)',
      type: 'date',
    }),
    defineField({
      name: 'showOnWebsite',
      title: 'Show on the website',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off for the Unassigned pile so it stays in Studio only.',
    }),
    defineField({
      name: 'photos',
      title: 'Photos',
      type: 'array',
      of: [{ type: 'legacyImage' }],
      description:
        'Add watermarked photos from the media library (search “roofproject-wm”). Empty is fine — the website keeps a blank slot.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      family: 'family',
      photos: 'photos',
      listed: 'showOnWebsite',
    },
    prepare({ title, family, photos, listed }) {
      const count = Array.isArray(photos) ? photos.length : 0
      const group =
        family === 'aluminium'
          ? 'Aluminium'
          : family === 'paint'
            ? 'Roof paint'
            : family === 'unassigned'
              ? 'Unassigned'
              : 'Stone-coated'
      return {
        title: title || 'Untitled design',
        subtitle: [
          group,
          count ? count + ' photo' + (count === 1 ? '' : 's') : 'empty — add photos',
          listed === false ? 'hidden' : null,
        ]
          .filter(Boolean)
          .join(' · '),
        media: photos?.[0]?.asset,
      }
    },
  },
})
