import { defineArrayMember, defineField, defineType } from 'sanity'

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 200 },
      validation: (Rule) => Rule.required(),
      description: 'THE URL. See the warning on Post.slug - it applies equally here.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
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
          marks: {
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
    defineField({ name: 'publishedAt', type: 'datetime', group: 'content' }),
    defineField({ name: 'updatedAt', type: 'datetime', group: 'content' }),
    defineField({
      name: 'legacyId',
      title: 'WordPress page ID',
      type: 'number',
      readOnly: true,
      group: 'content',
    }),
    defineField({ name: 'seo', type: 'seo', group: 'seo' }),
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
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
