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
      name: 'projects',
      title: 'Photo galleries',
      type: 'array',
      group: 'content',
      hidden: ({ document }) => {
        const id = String(
          (document as { _id?: string } | undefined)?._id || ''
        ).replace(/^drafts\./, '')
        if (id === 'page-e0cbc0cefc828f0559f9acdb') return false
        const slug = (document as { slug?: { current?: string } } | undefined)?.slug
          ?.current
        return slug !== 'projects' && slug !== 'roofprojects'
      },
      description:
        'Open a design, then Photos, to add or remove pictures. This list is what appears on /projects/. Unassigned at the bottom stays off the website.',
      of: [{ type: 'roofProject' }],
    }),
    defineField({
      name: 'body',
      title: 'Page content',
      type: 'array',
      group: 'content',
      of: portableBodyMembers,
    }),
    defineField({ name: 'seo', title: 'Search listing', type: 'seo', group: 'seo' }),
    defineField({
      name: 'faq',
      title: 'FAQs',
      type: 'array',
      group: 'content',
      description:
        'Questions and answers shown at the bottom of the page and sent to Google. Add a question, then the answer, then Publish.',
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
