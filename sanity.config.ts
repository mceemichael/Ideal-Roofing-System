import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { apiVersion, dataset, projectId } from './sanity/env'
import { schemaTypes } from './sanity/schemas'

export default defineConfig({
  name: 'ideal-roofing-system',
  title: 'Ideal Roofing System',
  basePath: '/studio',
  projectId,
  dataset,
  schema: { types: schemaTypes },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Site settings')
              .id('siteSettings')
              .child(
                S.document().schemaType('siteSettings').documentId('siteSettings')
              ),
            S.divider(),
            S.documentTypeListItem('post').title('Posts'),
            S.documentTypeListItem('page').title('Pages'),
            S.divider(),
            S.documentTypeListItem('category').title('Categories'),
            S.documentTypeListItem('tag').title('Tags'),
            S.documentTypeListItem('author').title('Authors'),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  document: {
    // Live URL button in the Studio, so you can jump straight to any page.
    productionUrl: async (prev, context) => {
      const doc = context.document as any
      const slug = doc?.slug?.current
      if (!slug) return prev
      const base =
        process.env.NEXT_PUBLIC_SITE_URL || 'https://idealroofingsystem.com'
      if (doc._type === 'tag') return base + '/tag/' + slug + '/'
      return base + '/' + slug + '/'
    },
  },
})
