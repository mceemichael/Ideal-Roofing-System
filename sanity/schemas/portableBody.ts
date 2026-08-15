import { defineArrayMember } from 'sanity'

/**
 * Shared Portable Text members for posts and pages.
 * Order is the insert-menu order — everyday blocks first, advanced last.
 */
export const portableBodyMembers = [
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
            {
              name: 'href',
              type: 'url',
              title: 'URL',
              validation: (Rule: any) =>
                Rule.uri({ allowRelative: true, scheme: ['http', 'https', 'mailto', 'tel'] }),
            },
            { name: 'newTab', type: 'boolean', title: 'Open in a new tab' },
          ],
        },
      ],
    },
  }),
  defineArrayMember({ type: 'legacyImage', title: 'Image' }),
  defineArrayMember({ type: 'youtube', title: 'YouTube video' }),
  defineArrayMember({ type: 'priceTable', title: 'Price table' }),
  defineArrayMember({ type: 'callout', title: 'Tip / callout' }),
  defineArrayMember({ type: 'imageCarousel', title: 'Image carousel' }),
  defineArrayMember({ type: 'toolEmbed', title: 'Calculator (advanced)' }),
  defineArrayMember({ type: 'htmlEmbed', title: 'Raw HTML (advanced)' }),
]
