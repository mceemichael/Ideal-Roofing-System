import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { SearchIcon } from '@sanity/icons'
import { apiVersion, dataset, projectId } from './sanity/env'
import { schemaTypes } from './sanity/schemas'
import { SeoScoreBadge } from './sanity/components/SeoScoreBadge'
import { SeoScorePanel } from './sanity/components/SeoScorePanel'
import { SeoOverviewTool } from './sanity/tools/SeoOverviewTool'

// Adds a "SEO Analysis" tab (see SeoScorePanel) next to the normal editing
// form for a single document type, keeping the plain S.documentTypeListItem
// shorthand everywhere else that doesn't need it.
function documentTypeWithSeoView(S: any, type: string, title: string) {
  return S.listItem()
    .title(title)
    .schemaType(type)
    .child(
      S.documentTypeList(type)
        .title(title)
        .child((documentId: string) =>
          S.document()
            .documentId(documentId)
            .schemaType(type)
            .views([
              S.view.form(),
              S.view.component(SeoScorePanel).title('SEO Analysis').icon(SearchIcon),
            ])
        )
    )
}

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
            documentTypeWithSeoView(S, 'post', 'Posts'),
            documentTypeWithSeoView(S, 'page', 'Pages'),
            S.divider(),
            S.documentTypeListItem('category').title('Categories'),
            S.documentTypeListItem('tag').title('Tags'),
            S.documentTypeListItem('author').title('Authors'),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  tools: [
    {
      name: 'seo-overview',
      title: 'SEO Overview',
      icon: SearchIcon,
      component: SeoOverviewTool,
    },
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
    // "SEO: 80% Good" badge next to the Published/Draft status, so the
    // score is visible without opening the SEO Analysis tab at all.
    badges: (prev, context) =>
      context.schemaType === 'post' || context.schemaType === 'page'
        ? [...prev, SeoScoreBadge]
        : prev,
  },
})
