import { defineField, defineType } from 'sanity'

/**
 * Structured price tables.
 *
 * Your pricelist posts are the commercial heart of the site and the tables in
 * them are what actually ranks. Storing them as structured data rather than a
 * blob of HTML means: they render responsively on mobile, you can update a
 * single price without touching markup, and we can emit Product/Offer
 * structured data from them later for rich results.
 */
export default defineType({
  name: 'priceTable',
  title: 'Price table',
  type: 'object',
  fields: [
    defineField({ name: 'caption', title: 'Caption', type: 'string' }),
    defineField({
      name: 'headers',
      title: 'Column headers',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'row',
          fields: [
            {
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [{ type: 'string' }],
            },
          ],
          preview: {
            select: { cells: 'cells' },
            prepare({ cells }) {
              return { title: (cells || []).join('  |  ') }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'footnote',
      title: 'Footnote',
      type: 'text',
      rows: 2,
      description: 'e.g. "Prices updated July 2026. Subject to change."',
    }),
  ],
  preview: {
    select: { title: 'caption', rows: 'rows' },
    prepare({ title, rows }) {
      const n = Array.isArray(rows) ? rows.length : 0
      return { title: title || 'Price table', subtitle: n + ' rows' }
    },
  },
})
