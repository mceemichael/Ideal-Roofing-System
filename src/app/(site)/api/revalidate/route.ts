import { revalidateTag, revalidatePath } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { submitIndexNow } from '@/lib/indexnow'

/**
 * Sanity webhook target. Hitting publish in the Studio makes the affected
 * page rebuild within a couple of seconds instead of waiting for the hourly
 * revalidation window.
 *
 * Set up in Sanity: Manage -> API -> Webhooks
 *   URL     https://idealroofingsystem.com/api/revalidate
 *   Dataset production
 *   Trigger on: create, update, delete
 *   Secret  <same value as SANITY_REVALIDATE_SECRET>
 *   Projection  {_type, "slug": slug.current}
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret') ??
    new URL(req.url).searchParams.get('secret')

  if (!process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: 'SANITY_REVALIDATE_SECRET is not configured' },
      { status: 500 }
    )
  }

  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  let body: { _type?: string; slug?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 })
  }

  const { _type, slug } = body
  if (!_type) {
    return NextResponse.json({ message: 'Missing _type' }, { status: 400 })
  }

  const revalidated: string[] = []

  // Broad tag for listing pages that include this document type.
  revalidateTag(_type)
  revalidated.push(_type)

  // Narrow tag for the specific document.
  if (slug) {
    revalidateTag(_type + ':' + slug)
    revalidated.push(_type + ':' + slug)

    if (_type === 'post' || _type === 'page' || _type === 'category') {
      revalidatePath('/' + slug, 'page')
      revalidated.push('/' + slug)
    }
    if (_type === 'tag') {
      revalidatePath('/tag/' + slug, 'page')
      revalidated.push('/tag/' + slug)
    }
  }

  // Anything that changes a post also changes the index, the homepage,
  // the sitemap and the feed.
  if (_type === 'post') {
    revalidatePath('/blogs-and-projects', 'page')
    revalidatePath('/', 'page')
    revalidatePath('/sitemap.xml')
    revalidatePath('/feed.xml')
    revalidated.push('/blogs-and-projects', '/', '/sitemap.xml', '/feed.xml')
  }

  if (_type === 'siteSettings') {
    revalidatePath('/', 'layout')
    revalidated.push('layout')
  }

  const indexNowPaths: string[] = []
  if (slug) {
    if (_type === 'tag') indexNowPaths.push('/tag/' + slug + '/')
    else if (_type === 'author') indexNowPaths.push('/author/' + slug + '/')
    else if (_type === 'post' || _type === 'page' || _type === 'category') {
      indexNowPaths.push('/' + slug + '/')
    }
  }
  if (_type === 'post') {
    indexNowPaths.push('/', '/blogs-and-projects/')
  }

  const indexNow = await submitIndexNow(indexNowPaths)

  return NextResponse.json({ revalidated, indexNow, now: Date.now() })
}
