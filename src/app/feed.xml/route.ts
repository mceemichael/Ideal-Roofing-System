import { sanityFetch } from '../../../sanity/client'
import { feedQuery } from '../../../sanity/queries'
import { site } from '@/lib/site'
import { absoluteUrl } from '@/lib/seo'

export const revalidate = 3600

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Replaces the WordPress /feed/ endpoint (which 301s here).
 *
 * Worth keeping: feed readers, Mailchimp RSS campaigns and content
 * aggregators subscribe to these and silently stop working if the URL dies.
 */
export async function GET() {
  const posts = await sanityFetch<
    Array<{
      title: string
      slug: string
      excerpt?: string
      publishedAt?: string
      author?: { name?: string }
    }>
  >({ query: feedQuery, tags: ['post'] }).catch(() => [])

  const items = posts
    .map((p) => {
      const url = absoluteUrl('/' + p.slug + '/')
      return [
        '    <item>',
        '      <title>' + escapeXml(p.title) + '</title>',
        '      <link>' + url + '</link>',
        '      <guid isPermaLink="true">' + url + '</guid>',
        p.publishedAt
          ? '      <pubDate>' + new Date(p.publishedAt).toUTCString() + '</pubDate>'
          : '',
        p.author?.name
          ? '      <dc:creator><![CDATA[' + p.author.name + ']]></dc:creator>'
          : '',
        p.excerpt
          ? '      <description><![CDATA[' + p.excerpt + ']]></description>'
          : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>' + escapeXml(site.name) + '</title>',
    '    <link>' + absoluteUrl('/') + '</link>',
    '    <description>' + escapeXml(site.description) + '</description>',
    '    <language>en-US</language>',
    '    <lastBuildDate>' + new Date().toUTCString() + '</lastBuildDate>',
    '    <atom:link href="' + absoluteUrl('/').replace(/\/$/, '') + '/feed.xml" rel="self" type="application/rss+xml" />',
    items,
    '  </channel>',
    '</rss>',
  ].join('\n')

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
