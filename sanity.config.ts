import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { CommentIcon, SearchIcon } from '@sanity/icons'
import { apiVersion, dataset, projectId } from './sanity/env'
import { schemaTypes } from './sanity/schemas'
import { SeoScoreBadge } from './sanity/components/SeoScoreBadge'
import { SeoScorePanel } from './sanity/components/SeoScorePanel'
import { SeoOverviewTool } from './sanity/tools/SeoOverviewTool'
import { PublishWithTimestamp } from './sanity/actions/publishWithTimestamp'

// Adds a "SEO Analysis" tab (see SeoScorePanel) next to the normal editing
// form for a single document type, keeping the plain S.documentTypeListItem
// shorthand everywhere else that doesn't need it.
function documentTypeWithSeoView(S: any, type: string, title: string) {
  let list = S.documentTypeList(type).title(title)
  if (type === 'post') {
    list = list.defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
  }
  return S.listItem()
    .title(title)
    .schemaType(type)
    .child(
      list.child((documentId: string) =>
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
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Ideal Roofing')
          .items([
            documentTypeWithSeoView(S, 'post', 'Blog posts'),
            documentTypeWithSeoView(S, 'page', 'Pages'),
            S.listItem()
              .title('Comments')
              .icon(CommentIcon)
              .child(
                S.list()
                  .title('Comments')
                  .items([
                    S.listItem()
                      .title('Waiting for approval')
                      .schemaType('comment')
                      .child(
                        S.documentTypeList('comment')
                          .title('Waiting for approval')
                          .filter('_type == "comment" && approved != true')
                          .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                      ),
                    S.listItem()
                      .title('Approved')
                      .schemaType('comment')
                      .child(
                        S.documentTypeList('comment')
                          .title('Approved')
                          .filter('_type == "comment" && approved == true')
                          .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                      ),
                    S.listItem()
                      .title('All comments')
                      .schemaType('comment')
                      .child(
                        S.documentTypeList('comment')
                          .title('All comments')
                          .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                      ),
                  ])
              ),
            S.divider(),
            S.documentTypeListItem('category').title('Categories'),
            S.documentTypeListItem('tag').title('Tags'),
            S.documentTypeListItem('author').title('Authors'),
            S.divider(),
            S.listItem()
              .title('Site settings')
              .id('siteSettings')
              .child(
                S.document().schemaType('siteSettings').documentId('siteSettings')
              ),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  tools: (prev) => [
    ...prev.filter((tool) => tool.name !== 'vision'),
    {
      name: 'seo-overview',
      title: 'SEO Overview',
      icon: SearchIcon,
      component: SeoOverviewTool,
    },
  ],
  schema: {
    types: schemaTypes,
    templates: (prev) =>
      prev.map((template) => {
        if (template.schemaType === 'post') {
          return { ...template, title: 'New blog post' }
        }
        if (template.schemaType === 'page') {
          return { ...template, title: 'New page' }
        }
        return template
      }),
  },
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
    actions: (prev, context) => {
      if (context.schemaType !== 'post' && context.schemaType !== 'page') {
        return prev
      }
      return prev.map((action) =>
        action.action === 'publish' ? PublishWithTimestamp : action
      )
    },
  },
})
