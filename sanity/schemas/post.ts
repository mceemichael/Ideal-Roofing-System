import { defineField, defineType } from 'sanity'
import { portableBodyMembers } from './portableBody'

export default defineType({
  name: 'post',
  title: 'Blog post',
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
      description: 'The heading readers see at the top of the page.',
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
        'Click Generate after you type the headline. On old (imported) posts this is locked — changing it would break the Google listing.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Short summary',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'One or two sentences. Shown on the blog listing and in Google if you leave the SEO description empty.',
    }),
    defineField({
      name: 'featuredImage',
      title: 'Main photo',
      type: 'legacyImage',
      group: 'content',
      description: 'Used on the blog card, WhatsApp/Facebook shares, and Google. Upload a photo and fill in Alt text.',
    }),
    defineField({
      name: 'body',
      title: 'Article',
      type: 'array',
      group: 'content',
      of: portableBodyMembers,
      description: 'Write here. Use the + button to add a photo, YouTube video, or price table.',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'content',
      initialValue: { _ref: 'author-515fbd42521c4b27741bc563' },
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      group: 'content',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
      group: 'content',
    }),

    defineField({ name: 'seo', title: 'Search listing', type: 'seo', group: 'seo' }),
    defineField({
      name: 'faq',
      title: 'FAQ for Google',
      type: 'array',
      group: 'seo',
      description:
        'Optional. Also add the same questions as headings in the article — Google wants visitors to see the answers on the page.',
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
      validation: (Rule) => Rule.required(),
      description: 'Filled in automatically for new posts. Leave the original date on old posts.',
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last updated',
      type: 'datetime',
      group: 'publishing',
      description: 'Set automatically when you click Publish. Tells Google the page is fresh.',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Main YouTube URL (optional)',
      type: 'url',
      group: 'publishing',
      description: 'Only if this post has a hero video. You can also drop a YouTube block in the article.',
    }),
    defineField({
      name: 'readingTime',
      title: 'Reading time (minutes)',
      type: 'number',
      group: 'publishing',
    }),
    defineField({
      name: 'legacyId',
      title: 'WordPress post ID',
      type: 'number',
      group: 'publishing',
      readOnly: true,
      hidden: ({ document }) => !document?.legacyId,
      description: 'Imported. Leave this alone.',
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current', media: 'featuredImage.asset' },
  },
})
