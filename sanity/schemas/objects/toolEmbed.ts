import { defineField, defineType } from 'sanity'

/**
 * Places an interactive tool inside page content.
 *
 * Modelled as a content block rather than hard-coded into the route, because
 * on the live site the length converter sits partway down the page with
 * explanatory text above and below it. Hard-coding the tools would have forced
 * the content into a fixed order and made it un-editable.
 */
export default defineType({
  name: 'toolEmbed',
  title: 'Interactive tool',
  type: 'object',
  fields: [
    defineField({
      name: 'tool',
      title: 'Which tool',
      type: 'string',
      options: {
        list: [
          { title: 'Roof area calculator', value: 'roofAreaCalculator' },
          { title: 'Length converter (feet ↔ metres)', value: 'lengthConverter' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { tool: 'tool' },
    prepare({ tool }) {
      const names: Record<string, string> = {
        roofAreaCalculator: 'Roof area calculator',
        lengthConverter: 'Length converter',
      }
      return { title: names[tool] || 'Interactive tool', subtitle: 'Interactive tool' }
    },
  },
})
