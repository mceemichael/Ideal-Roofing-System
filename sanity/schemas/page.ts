import { defineField, defineType } from 'sanity'
import { portableBodyMembers } from './portableBody'

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: [
    { name: 'content', title: 'Write', default: true },
    { name: 'seo', title: 'SEO' },
    { name: 'publishing', title: 'Publishing' },
  ],
  initialValue: () => ({
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seo: { noIndex: false },
  }),
  fields: [
    defineField({
      name: 'title',
      title: 'Headline',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 200 },
      validation: (Rule) => Rule.required(),
      readOnly: ({ document }) => Boolean((document as { legacyId?: number } | undefined)?.legacyId),
      description:
        'Click Generate after you type the headline. Locked on imported pages so the Google URL does not change.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Top photo',
      type: 'legacyImage',
      group: 'content',
    }),
    defineField({
      name: 'body',
      title: 'Page content',
      type: 'array',
      group: 'content',
      of: portableBodyMembers,
    }),
    defineField({
      name: 'projects',
      title: 'Roof projects',
      type: 'array',
      group: 'content',
      hidden: ({ document }) =>
        (document as { slug?: { current?: string } } | undefined)?.slug?.current !==
        'roofprojects',
      description:
        'Design galleries on /roofprojects/. Add watermarked photos under each design (Shingle, Milano, …). Unassigned at the bottom is hidden on the website.',
      of: [{ type: 'roofProject' }],
    }),
    defineField({ name: 'seo', title: 'Search listing', type: 'seo', group: 'seo' }),
    defineField({
      name: 'faq',
      title: 'FAQ for Google',
      type: 'array',
      group: 'seo',
      description:
        'Optional. Also add the same questions as headings in the page content.',
      of: [
        {
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({ name: 'question', title: 'Question', type: 'string' }),
            defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 3 }),
          ],
          preview: {
            select: { title: 'question' },
          },
        },
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'First published',
      type: 'datetime',
      group: 'publishing',
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last updated',
      type: 'datetime',
      group: 'publishing',
      description: 'Set automatically when you click Publish.',
    }),
    defineField({
      name: 'legacyId',
      title: 'WordPress page ID',
      type: 'number',
      readOnly: true,
      group: 'publishing',
      hidden: ({ document }) => !document?.legacyId,
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
