import { defineField, defineType } from 'sanity'

/**
 * Escape hatch for HTML the migration script could not confidently convert to
 * Portable Text.
 *
 * The alternative - dropping it - is how migrations silently lose content and
 * then rankings three weeks later. Anything that lands here is logged during
 * import so you can review and convert it properly at your leisure. Until then
 * it renders exactly as it did on WordPress.
 */
export default defineType({
  name: 'htmlEmbed',
  title: 'Raw HTML (from WordPress)',
  type: 'object',
  fields: [
    defineField({
      name: 'html',
      title: 'HTML',
      type: 'text',
      rows: 10,
    }),
    defineField({
      name: 'note',
      title: 'Migration note',
      type: 'string',
      readOnly: true,
    }),
  ],
  preview: {
    select: { subtitle: 'note', html: 'html' },
    prepare({ subtitle, html }) {
      return {
        title: 'Raw HTML block',
        subtitle: subtitle || String(html || '').slice(0, 60),
      }
    },
  },
})
