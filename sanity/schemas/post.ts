import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'meta', title: 'Meta' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 200 },
      validation: (Rule) => Rule.required(),
      description:
        'THE URL. Changing this on an existing post breaks every link Google has and every backlink you have earned. If you must change one, add a 301 to src/lib/redirects.js in the same commit.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Shown on the blog index and in card listings.',
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured image',
      type: 'legacyImage',
      group: 'content',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      group: 'content',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Underline', value: 'underline' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  { name: 'href', type: 'url', title: 'URL',
                    validation: (Rule: any) =>
                      Rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }) },
                  { name: 'newTab', type: 'boolean', title: 'Open in new tab' },
                ],
              },
            ],
          },
        }),
        defineArrayMember({ type: 'legacyImage' }),
        defineArrayMember({ type: 'priceTable' }),
        defineArrayMember({ type: 'youtube' }),
        defineArrayMember({ type: 'callout' }),
        defineArrayMember({ type: 'toolEmbed' }),
        defineArrayMember({ type: 'imageCarousel' }),
        defineArrayMember({ type: 'htmlEmbed' }),
      ],
    }),

    // ---- Meta -----------------------------------------------------------
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      group: 'meta',
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      group: 'meta',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
      group: 'meta',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'meta',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Last updated',
      type: 'datetime',
      group: 'meta',
      description:
        'Drives lastmod in the sitemap. The importer preserves the original WordPress value - do not bulk-reset these, a sitemap where every date is today reads to Google as a whole-site rewrite.',
    }),
    defineField({
      name: 'videoUrl',
      title: 'Primary video URL',
      type: 'url',
      group: 'meta',
      description:
        'If this post has a hero video, put it here. Emits VideoObject schema and includes the post in the video sitemap, matching your current setup.',
    }),
    defineField({
      name: 'readingTime',
      title: 'Reading time (minutes)',
      type: 'number',
      group: 'meta',
    }),
    defineField({
      name: 'legacyId',
      title: 'WordPress post ID',
      type: 'number',
      group: 'meta',
      readOnly: true,
      description: 'Lets middleware.ts resolve old /?p=123 URLs. Do not edit.',
    }),

    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
    defineField({
      name: 'faq',
      title: 'FAQ',
      type: 'array',
      group: 'seo',
      description:
        'Optional. Emits FAQPage structured data for rich results and AI answer engines. Should mirror a visible Q&A section in the body, not stand alone — Google expects the markup to match what a reader actually sees on the page.',
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
