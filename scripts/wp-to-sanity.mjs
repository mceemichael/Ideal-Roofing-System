#!/usr/bin/env node
/**
 * WordPress WXR  ->  Sanity NDJSON
 *
 *   node scripts/wp-to-sanity.mjs wordpress-export.xml
 *   npx sanity dataset import sanity-import.ndjson production --replace
 *
 * ---------------------------------------------------------------------------
 * Design principles, in priority order:
 *
 * 1. NEVER DROP CONTENT. Anything this script cannot confidently convert to
 *    Portable Text becomes an `htmlEmbed` block and is logged. Silent content
 *    loss is the number one cause of post-migration ranking drops, and it is
 *    invisible until traffic reports come in weeks later.
 *
 * 2. PRESERVE SLUGS EXACTLY. A slug is a URL is a ranking. No normalisation,
 *    no cleanup, no "improvements".
 *
 * 3. PRESERVE DATES. Both published and modified. A sitemap where every
 *    lastmod is today reads to Google as a simultaneous site-wide rewrite.
 *
 * 4. PRESERVE RANK MATH META. Titles and descriptions are what currently
 *    appear in the SERPs. Changing them changes your click-through rate, which
 *    is a change you want to make deliberately, not as a migration side effect.
 * ---------------------------------------------------------------------------
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import crypto from 'node:crypto'

const inputPath = process.argv[2] || 'wordpress-export.xml'
const outputPath = process.argv[3] || 'sanity-import.ndjson'

/* ===================================================================== */
/* Utilities                                                             */
/* ===================================================================== */

const warnings = []
const stats = {
  posts: 0,
  pages: 0,
  categories: 0,
  tags: 0,
  authors: 0,
  tablesConverted: 0,
  videosConverted: 0,
  imagesFound: 0,
  htmlFallbacks: 0,
  comments: 0,
  toolsDetected: 0,
}

/** Stable, deterministic IDs so re-running the import updates rather than duplicates. */
function idFor(type, key) {
  const hash = crypto.createHash('sha1').update(type + ':' + key).digest('hex').slice(0, 24)
  return type + '-' + hash
}

function keyGen() {
  return crypto.randomBytes(6).toString('hex')
}

function decodeEntities(str) {
  if (!str) return ''
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

/**
 * WordPress exports each date twice: `wp:post_date` in site-local time and
 * `wp:post_date_gmt` already in UTC. Applying the site's UTC+1 (WAT) offset to
 * a value that is already UTC shifts every timestamp by an hour — which then
 * shows up as wrong publish dates on every post and wrong `lastmod` values in
 * the sitemap. So the caller has to say which kind it is passing.
 */
function toIso(wpDate, { isGmt = false } = {}) {
  if (!wpDate || wpDate === '0000-00-00 00:00:00') return null
  const suffix = isGmt ? 'Z' : '+01:00' // WAT, Africa/Lagos
  const d = new Date(wpDate.replace(' ', 'T') + suffix)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function estimateReadingTime(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 225))
}

/* ===================================================================== */
/* WXR parsing                                                           */
/* ===================================================================== */

console.log('Reading ' + inputPath + ' ...')
const xml = readFileSync(inputPath, 'utf8')
const dom = new JSDOM(xml, { contentType: 'text/xml' })
const doc = dom.window.document

function text(node, selector) {
  const el = node.querySelector(selector)
  return el ? decodeEntities(el.textContent || '') : ''
}

/** WXR namespaced tags (wp:post_id) need getElementsByTagName, not querySelector. */
function nsText(node, tagName) {
  const els = node.getElementsByTagName(tagName)
  return els.length ? decodeEntities(els[0].textContent || '') : ''
}

function postMeta(item, key) {
  const metas = Array.from(item.getElementsByTagName('wp:postmeta'))
  for (const m of metas) {
    const k = m.getElementsByTagName('wp:meta_key')[0]?.textContent
    if (k === key) {
      return decodeEntities(
        m.getElementsByTagName('wp:meta_value')[0]?.textContent || ''
      )
    }
  }
  return ''
}

/* ===================================================================== */
/* HTML -> Portable Text                                                 */
/* ===================================================================== */

const BLOCK_STYLES = {
  H1: 'h2', // demote: only one h1 per page, and the title owns it
  H2: 'h2',
  H3: 'h3',
  H4: 'h4',
  H5: 'h4',
  H6: 'h4',
  P: 'normal',
  BLOCKQUOTE: 'blockquote',
}

/**
 * Convert an element's inline children into Portable Text spans + markDefs.
 * Handles nested <strong><em><a> combinations, which WordPress produces a lot
 * of and which naive converters flatten into plain text.
 */
function inlineToSpans(node, ownerDoc) {
  const spans = []
  const markDefs = []

  function walk(n, activeMarks) {
    for (const child of Array.from(n.childNodes)) {
      if (child.nodeType === 3) {
        const value = decodeEntities(child.textContent || '')
        if (!value) continue
        spans.push({
          _type: 'span',
          _key: keyGen(),
          text: value,
          marks: [...activeMarks],
        })
        continue
      }

      if (child.nodeType !== 1) continue
      const tag = child.tagName.toUpperCase()

      if (tag === 'BR') {
        spans.push({ _type: 'span', _key: keyGen(), text: '\n', marks: [] })
        continue
      }

      if (tag === 'STRONG' || tag === 'B') {
        walk(child, [...activeMarks, 'strong'])
        continue
      }
      if (tag === 'EM' || tag === 'I') {
        walk(child, [...activeMarks, 'em'])
        continue
      }
      if (tag === 'U') {
        walk(child, [...activeMarks, 'underline'])
        continue
      }

      if (tag === 'A') {
        const href = child.getAttribute('href')
        if (href) {
          const key = keyGen()
          markDefs.push({
            _type: 'link',
            _key: key,
            href,
            newTab: child.getAttribute('target') === '_blank',
          })
          walk(child, [...activeMarks, key])
          continue
        }
      }

      // Any other inline wrapper (span, code, small...): keep the text.
      walk(child, activeMarks)
    }
  }

  walk(node, [])
  return { spans: spans.filter((s) => s.text), markDefs }
}

function makeBlock(style, node) {
  const { spans, markDefs } = inlineToSpans(node)
  if (!spans.length) return null
  return {
    _type: 'block',
    _key: keyGen(),
    style,
    markDefs,
    children: spans,
  }
}

function makeListBlocks(listNode, listItem) {
  const blocks = []
  for (const li of Array.from(listNode.children)) {
    if (li.tagName.toUpperCase() !== 'LI') continue
    const { spans, markDefs } = inlineToSpans(li)
    if (!spans.length) continue
    blocks.push({
      _type: 'block',
      _key: keyGen(),
      style: 'normal',
      listItem,
      level: 1,
      markDefs,
      children: spans,
    })
  }
  return blocks
}

/**
 * <table> -> priceTable.
 *
 * These matter more than anything else in the migration. The pricelist posts
 * are the commercial core of the site and the tables in them are the content
 * that actually ranks. Losing one is losing the page.
 */
function tableToPriceTable(tableNode) {
  const rows = Array.from(tableNode.querySelectorAll('tr'))
  if (!rows.length) return null

  let headers = []
  let bodyRows = rows

  const firstRowCells = Array.from(rows[0].children)
  const firstRowIsHeader =
    firstRowCells.length > 0 &&
    firstRowCells.every((c) => c.tagName.toUpperCase() === 'TH')

  if (firstRowIsHeader) {
    headers = firstRowCells.map((c) => decodeEntities(c.textContent || '').trim())
    bodyRows = rows.slice(1)
  }

  const cells = bodyRows
    .map((tr) => ({
      _type: 'row',
      _key: keyGen(),
      cells: Array.from(tr.children).map((td) =>
        decodeEntities(td.textContent || '').replace(/\s+/g, ' ').trim()
      ),
    }))
    .filter((r) => r.cells.some((c) => c))

  if (!cells.length) return null

  const caption = tableNode.querySelector('caption')
  stats.tablesConverted++

  return {
    _type: 'priceTable',
    _key: keyGen(),
    caption: caption ? decodeEntities(caption.textContent || '').trim() : undefined,
    headers: headers.length ? headers : undefined,
    rows: cells,
  }
}

function iframeToBlock(iframeNode) {
  const src = iframeNode.getAttribute('src') || ''
  if (/youtube|youtu\.be/.test(src)) {
    stats.videosConverted++
    return {
      _type: 'youtube',
      _key: keyGen(),
      url: src.startsWith('//') ? 'https:' + src : src,
      title: iframeNode.getAttribute('title') || undefined,
    }
  }
  // Non-YouTube iframe (maps, forms): preserve verbatim.
  stats.htmlFallbacks++
  return {
    _type: 'htmlEmbed',
    _key: keyGen(),
    html: iframeNode.outerHTML,
    note: 'Non-YouTube iframe preserved from WordPress',
  }
}

function imgToBlock(imgNode, figureNode) {
  const src = imgNode.getAttribute('src') || imgNode.getAttribute('data-src')
  if (!src) return null
  // Skip the inline SVG placeholders WP Rocket's lazyload injects.
  if (src.startsWith('data:image/svg+xml')) return null

  stats.imagesFound++
  const caption = figureNode?.querySelector('figcaption')

  return {
    _type: 'legacyImage',
    _key: keyGen(),
    // The URL is kept as-is. next.config.mjs rewrites /wp-content/uploads/*
    // so these keep resolving; migrating them into Sanity on day one would
    // change 200 image URLs at the worst possible moment.
    legacyUrl: src.startsWith('http')
      ? src.replace(/^https?:\/\/[^/]+/, '')
      : src,
    alt: imgNode.getAttribute('alt') || '',
    caption: caption ? decodeEntities(caption.textContent || '').trim() : undefined,
    width: Number(imgNode.getAttribute('width')) || undefined,
    height: Number(imgNode.getAttribute('height')) || undefined,
  }
}

/**
 * Recognises the old WordPress calculator widgets by their visible labels.
 *
 * Matching on text rather than class names on purpose: the classes came from
 * a page builder and are unstable, but the labels are what users read and
 * they have not changed in years.
 */
function detectTool(node) {
  const text = (node.textContent || '').toLowerCase()
  const hasScript = node.querySelector('script') !== null
  const hasInput = node.querySelector('input, select, button') !== null
  if (!hasScript && !hasInput) return null

  if (text.includes('calculate roof area') || text.includes('house length')) {
    return 'roofAreaCalculator'
  }
  if (text.includes('length converter') || (text.includes('select unit') && text.includes('feet'))) {
    return 'lengthConverter'
  }
  return null
}

/**
 * A handful of old "Custom HTML" widgets (the roof calculator, the length
 * converter) were pasted in as a complete standalone document — full
 * <!DOCTYPE html><html><head>...<body>...</body></html> — sitting mid-content
 * rather than inside any wrapping <div>/<form>/<section>. Left alone, two
 * things go wrong: the h1/label/input/select/button controls end up as bare
 * siblings with no container node for detectTool() below to test, so they
 * fall through one-by-one into individual htmlEmbed fallbacks instead of one
 * clean toolEmbed; and the stray nested <html>/<body> tags are themselves
 * invalid at this depth. Unwrapping each one down to its <body> content inside
 * a plain <div> gives detectTool() exactly the shape it already expects.
 */
function unwrapEmbeddedDocuments(html) {
  return html.replace(
    /<!DOCTYPE\s+html[^>]*>[\s\S]*?<html[^>]*>[\s\S]*?<body[^>]*>([\s\S]*?)<\/body>[\s\S]*?<\/html>/gi,
    (_match, bodyInner) => '<div class="legacy-html-widget">' + bodyInner + '</div>'
  )
}

/** Main HTML -> Portable Text conversion. */
function htmlToPortableText(html, contextLabel) {
  if (!html || !html.trim()) return []

  html = unwrapEmbeddedDocuments(html)

  // WordPress stores paragraph breaks as blank lines rather than <p> tags
  // when the classic editor is used. Restore them before parsing, otherwise
  // an entire post collapses into one paragraph.
  let prepared = html
  if (!/<p[\s>]/i.test(html)) {
    prepared = html
      .split(/\n\s*\n/)
      .map((chunk) => (chunk.trim() ? '<p>' + chunk.trim() + '</p>' : ''))
      .join('\n')
  }

  const frag = new JSDOM('<body>' + prepared + '</body>')
  const body = frag.window.document.body
  const blocks = []

  function processNode(node) {
    if (node.nodeType === 3) {
      const t = (node.textContent || '').trim()
      if (t) {
        const p = frag.window.document.createElement('p')
        p.textContent = t
        const b = makeBlock('normal', p)
        if (b) blocks.push(b)
      }
      return
    }
    if (node.nodeType !== 1) return

    const tag = node.tagName.toUpperCase()

    // --- Tables ---
    if (tag === 'TABLE') {
      const t = tableToPriceTable(node)
      if (t) {
        blocks.push(t)
      } else {
        stats.htmlFallbacks++
        blocks.push({
          _type: 'htmlEmbed',
          _key: keyGen(),
          html: node.outerHTML,
          note: 'Table in "' + contextLabel + '" could not be parsed into rows - preserved as HTML',
        })
        warnings.push('[table] ' + contextLabel + ': preserved as raw HTML, review manually')
      }
      return
    }

    // --- Media ---
    if (tag === 'IFRAME') {
      blocks.push(iframeToBlock(node))
      return
    }

    if (tag === 'FIGURE') {
      const iframe = node.querySelector('iframe')
      if (iframe) {
        blocks.push(iframeToBlock(iframe))
        return
      }
      const img = node.querySelector('img')
      if (img) {
        const b = imgToBlock(img, node)
        if (b) blocks.push(b)
        return
      }
      // A figure with neither: recurse into it.
      for (const child of Array.from(node.childNodes)) processNode(child)
      return
    }

    if (tag === 'IMG') {
      const b = imgToBlock(node, null)
      if (b) blocks.push(b)
      return
    }

    // --- Lists ---
    if (tag === 'UL') {
      blocks.push(...makeListBlocks(node, 'bullet'))
      return
    }
    if (tag === 'OL') {
      blocks.push(...makeListBlocks(node, 'number'))
      return
    }

    // --- Text blocks ---
    if (BLOCK_STYLES[tag]) {
      // A <p> that only wraps an image should become the image, not an empty
      // paragraph. WordPress produces these constantly.
      const onlyImg =
        node.children.length === 1 &&
        node.children[0].tagName.toUpperCase() === 'IMG' &&
        !(node.textContent || '').trim()

      if (onlyImg) {
        const b = imgToBlock(node.children[0], null)
        if (b) blocks.push(b)
        return
      }

      const b = makeBlock(BLOCK_STYLES[tag], node)
      if (b) blocks.push(b)
      return
    }

    // --- Interactive tools ---
    // The WordPress calculators were a <div> of markup plus inline <script>.
    // Neither survives a CMS migration, so detect them by their visible text
    // and swap in the React equivalents, preserving their position in the page.
    if (tag === 'DIV' || tag === 'FORM' || tag === 'SECTION') {
      const tool = detectTool(node)
      if (tool) {
        stats.toolsDetected++
        blocks.push({ _type: 'toolEmbed', _key: keyGen(), tool })
        warnings.push(
          '[tool] ' + contextLabel + ': replaced the WordPress ' + tool +
          ' widget with the React component'
        )
        return
      }
    }

    // --- Containers: recurse ---
    if (['DIV', 'SECTION', 'ARTICLE', 'MAIN', 'ASIDE', 'BODY', 'CENTER'].includes(tag)) {
      for (const child of Array.from(node.childNodes)) processNode(child)
      return
    }

    if (tag === 'HR' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
      return
    }

    // --- Anything else: preserve verbatim rather than lose it ---
    const inner = (node.textContent || '').trim()
    if (inner) {
      stats.htmlFallbacks++
      blocks.push({
        _type: 'htmlEmbed',
        _key: keyGen(),
        html: node.outerHTML,
        note: 'Unrecognised <' + tag.toLowerCase() + '> in "' + contextLabel + '"',
      })
      warnings.push('[html] ' + contextLabel + ': <' + tag.toLowerCase() + '> preserved as raw HTML')
    }
  }

  for (const child of Array.from(body.childNodes)) processNode(child)
  return blocks.filter(Boolean)
}

/* ===================================================================== */
/* Extract WordPress entities                                            */
/* ===================================================================== */

const docs = []
const authorsBySlug = new Map()
const categoriesBySlug = new Map()
const tagsBySlug = new Map()

// ---- Authors ----
for (const a of Array.from(doc.getElementsByTagName('wp:author'))) {
  const login = nsText(a, 'wp:author_login')
  const display = nsText(a, 'wp:author_display_name') || login
  if (!login) continue

  const id = idFor('author', login)
  authorsBySlug.set(login, id)
  docs.push({
    _id: id,
    _type: 'author',
    name: display,
    slug: { _type: 'slug', current: login },
    legacyId: Number(nsText(a, 'wp:author_id')) || undefined,
  })
  stats.authors++
}

// ---- Taxonomies ----
for (const c of Array.from(doc.getElementsByTagName('wp:category'))) {
  const slug = nsText(c, 'wp:category_nicename')
  const name = nsText(c, 'wp:cat_name')
  if (!slug || slug === 'uncategorized') continue

  const id = idFor('category', slug)
  categoriesBySlug.set(slug, id)
  docs.push({
    _id: id,
    _type: 'category',
    title: name,
    slug: { _type: 'slug', current: slug },
    description: nsText(c, 'wp:category_description') || undefined,
    legacyId: Number(nsText(c, 'wp:term_id')) || undefined,
  })
  stats.categories++
}

for (const t of Array.from(doc.getElementsByTagName('wp:tag'))) {
  const slug = nsText(t, 'wp:tag_slug')
  const name = nsText(t, 'wp:tag_name')
  if (!slug) continue

  const id = idFor('tag', slug)
  tagsBySlug.set(slug, id)
  docs.push({
    _id: id,
    _type: 'tag',
    title: name,
    slug: { _type: 'slug', current: slug },
    description: nsText(t, 'wp:tag_description') || undefined,
    legacyId: Number(nsText(t, 'wp:term_id')) || undefined,
  })
  stats.tags++
}

// ---- Featured image lookup (attachment ID -> URL) ----
const attachments = new Map()
for (const item of Array.from(doc.getElementsByTagName('item'))) {
  if (nsText(item, 'wp:post_type') !== 'attachment') continue
  const id = nsText(item, 'wp:post_id')
  const url = nsText(item, 'wp:attachment_url')
  if (id && url) {
    attachments.set(id, {
      url: url.replace(/^https?:\/\/[^/]+/, ''),
      alt: postMeta(item, '_wp_attachment_image_alt'),
    })
  }
}

// ---- Posts and pages ----
for (const item of Array.from(doc.getElementsByTagName('item'))) {
  const postType = nsText(item, 'wp:post_type')
  const status = nsText(item, 'wp:status')

  if (postType !== 'post' && postType !== 'page') continue
  if (status !== 'publish') {
    warnings.push(
      '[skipped] ' + text(item, 'title') + ' (status: ' + status + ')'
    )
    continue
  }

  const title = text(item, 'title')
  const slug = nsText(item, 'wp:post_name')
  if (!slug) {
    warnings.push('[skipped] "' + title + '" has no slug')
    continue
  }

  const contentEl = item.getElementsByTagName('content:encoded')[0]
  const rawContent = contentEl ? contentEl.textContent || '' : ''
  const excerptEl = item.getElementsByTagName('excerpt:encoded')[0]
  const rawExcerpt = excerptEl ? excerptEl.textContent || '' : ''

  const body = htmlToPortableText(rawContent, slug)

  // Featured image
  const thumbId = postMeta(item, '_thumbnail_id')
  const thumb = thumbId ? attachments.get(thumbId) : null

  // Rank Math SEO fields. These are what Google currently shows.
  const rmTitle = postMeta(item, 'rank_math_title')
  const rmDesc = postMeta(item, 'rank_math_description')
  const rmCanonical = postMeta(item, 'rank_math_canonical_url')
  const rmRobots = postMeta(item, 'rank_math_robots')
  const rmFocus = postMeta(item, 'rank_math_focus_keyword')

  const seo = {}
  if (rmTitle) seo.title = rmTitle.replace(/%[a-z_]+%/g, '').trim()
  if (rmDesc) seo.description = rmDesc
  if (rmCanonical) seo.canonicalUrl = rmCanonical
  if (rmFocus) seo.focusKeyword = rmFocus.split(',')[0].trim()
  if (rmRobots && rmRobots.includes('noindex')) seo.noIndex = true

  const plainText = rawContent.replace(/<[^>]+>/g, ' ')
  const excerpt = rawExcerpt
    ? decodeEntities(rawExcerpt).replace(/<[^>]+>/g, '').trim()
    : rmDesc || plainText.replace(/\s+/g, ' ').trim().slice(0, 200)

  const base = {
    _id: idFor(postType, slug),
    _type: postType,
    title,
    // SLUG PRESERVED EXACTLY. No normalisation. This is the URL.
    slug: { _type: 'slug', current: slug },
    body,
    publishedAt:
      toIso(nsText(item, 'wp:post_date_gmt'), { isGmt: true }) ||
      toIso(nsText(item, 'wp:post_date')),
    // Preserved, never regenerated. This drives lastmod in the sitemap; if
    // every value became today's date, Google would read the whole site as
    // having been rewritten at once.
    updatedAt:
      toIso(nsText(item, 'wp:post_modified_gmt'), { isGmt: true }) ||
      toIso(nsText(item, 'wp:post_modified')) ||
      toIso(nsText(item, 'wp:post_date_gmt'), { isGmt: true }),
    legacyId: Number(nsText(item, 'wp:post_id')) || undefined,
  }

  if (Object.keys(seo).length) base.seo = seo

  if (postType === 'post') {
    base.excerpt = excerpt
    base.readingTime = estimateReadingTime(plainText)

    if (thumb) {
      base.featuredImage = {
        _type: 'legacyImage',
        legacyUrl: thumb.url,
        alt: thumb.alt || title,
      }
    }

    // Author
    const creator = text(item, 'creator') || nsText(item, 'dc:creator')
    if (creator && authorsBySlug.has(creator)) {
      base.author = { _type: 'reference', _ref: authorsBySlug.get(creator) }
    }

    // Categories and tags
    const cats = []
    const tgs = []
    for (const cat of Array.from(item.getElementsByTagName('category'))) {
      const domain = cat.getAttribute('domain')
      const nicename = cat.getAttribute('nicename')
      if (!nicename) continue
      if (domain === 'category' && categoriesBySlug.has(nicename)) {
        cats.push({
          _type: 'reference',
          _key: keyGen(),
          _ref: categoriesBySlug.get(nicename),
        })
      }
      if (domain === 'post_tag' && tagsBySlug.has(nicename)) {
        tgs.push({
          _type: 'reference',
          _key: keyGen(),
          _ref: tagsBySlug.get(nicename),
        })
      }
    }
    if (cats.length) base.categories = cats
    if (tgs.length) base.tags = tgs

    stats.posts++
  } else {
    if (thumb) {
      base.heroImage = {
        _type: 'legacyImage',
        legacyUrl: thumb.url,
        alt: thumb.alt || title,
      }
    }
    stats.pages++
  }

  /* ---- Comments ------------------------------------------------------
   * Easy to write off as optional. They are not: your roof area calculator
   * page carries six of them, and they are unique on-page text that no
   * competitor has, plus social proof at the exact moment someone is deciding
   * whether to trust your numbers.
   *
   * Only approved comments are carried over. Pending and spam are left behind
   * deliberately — you already decided about those once.
   * ------------------------------------------------------------------ */
  const wpComments = Array.from(item.getElementsByTagName('wp:comment'))
  const commentIdMap = new Map()

  // First pass: mint IDs so replies can reference their parent.
  for (const c of wpComments) {
    const cid = nsText(c, 'wp:comment_id')
    if (cid) commentIdMap.set(cid, idFor('comment', slug + ':' + cid))
  }

  for (const c of wpComments) {
    const approved = nsText(c, 'wp:comment_approved')
    if (approved !== '1') continue

    const cid = nsText(c, 'wp:comment_id')
    const author = nsText(c, 'wp:comment_author')
    const content = nsText(c, 'wp:comment_content')
    if (!author || !content) continue

    const parentId = nsText(c, 'wp:comment_parent')
    const authorEmail = nsText(c, 'wp:comment_author_email')
    const authorUrl = nsText(c, 'wp:comment_author_url')

    docs.push({
      _id: commentIdMap.get(cid) || idFor('comment', slug + ':' + cid),
      _type: 'comment',
      approved: true,
      name: author,
      email: authorEmail || undefined,
      website: authorUrl || undefined,
      body: content.replace(/<[^>]+>/g, '').trim(),
      post: { _type: 'reference', _ref: idFor(postType, slug) },
      ...(parentId && parentId !== '0' && commentIdMap.has(parentId)
        ? { parent: { _type: 'reference', _ref: commentIdMap.get(parentId) } }
        : {}),
      publishedAt:
        toIso(nsText(c, 'wp:comment_date_gmt'), { isGmt: true }) ||
        toIso(nsText(c, 'wp:comment_date')),
      // Preserved so shared links like /page/#comment-468 keep resolving.
      legacyId: Number(cid) || undefined,
      avatarUrl: authorEmail
        ? 'https://secure.gravatar.com/avatar/' +
          crypto.createHash('sha256').update(authorEmail.trim().toLowerCase()).digest('hex') +
          '?s=80&d=mm&r=g'
        : undefined,
    })
    stats.comments++
  }

  // A post with no body is almost always a parsing failure, not an empty post.
  if (!body.length) {
    warnings.push(
      '[EMPTY BODY] ' + slug + ' produced zero content blocks - CHECK THIS MANUALLY'
    )
  }

  docs.push(base)
}

// ---- Site settings singleton ----
docs.push({
  _id: 'siteSettings',
  _type: 'siteSettings',
  title: 'Ideal Roofing System | Best Roofing Company In Nigeria',
  description:
    "Ideal Roofing System is a trusted leader in Nigeria's roofing industry, specializing in the sales, and installation of Aluminiun and Stonecoated Roofing Sheets",
  reviewCount: 157,
  reviewRating: 4.9,
  stats: [
    { _key: keyGen(), value: '15+', label: 'Years In Business' },
    { _key: keyGen(), value: '7k+', label: 'Happy Clients' },
    { _key: keyGen(), value: '3.5k', label: 'Projects Completed' },
    { _key: keyGen(), value: '150+', label: 'Trained Staff' },
  ],
})

/* ===================================================================== */
/* Write output                                                          */
/* ===================================================================== */

const ndjson = docs.map((d) => JSON.stringify(d)).join('\n')
writeFileSync(outputPath, ndjson + '\n', 'utf8')

console.log('\n' + '='.repeat(64))
console.log('  MIGRATION COMPLETE  ->  ' + outputPath)
console.log('='.repeat(64))
console.log('  Posts                ' + stats.posts)
console.log('  Pages                ' + stats.pages)
console.log('  Categories           ' + stats.categories)
console.log('  Tags                 ' + stats.tags)
console.log('  Authors              ' + stats.authors)
console.log('  ---')
console.log('  Tables converted     ' + stats.tablesConverted)
console.log('  Videos converted     ' + stats.videosConverted)
console.log('  Images referenced    ' + stats.imagesFound)
console.log('  Raw HTML fallbacks   ' + stats.htmlFallbacks)
console.log('  Interactive tools    ' + stats.toolsDetected)
console.log('  Comments             ' + stats.comments)
console.log('='.repeat(64))

if (warnings.length) {
  console.log('\n' + warnings.length + ' item(s) need a look:\n')
  for (const w of warnings) console.log('  - ' + w)
  console.log(
    '\nNothing above was DROPPED - raw HTML fallbacks render exactly as they\n' +
      'did on WordPress. These are flagged so you can convert them properly\n' +
      'when convenient, not because anything is broken.\n'
  )
}

const empties = warnings.filter((w) => w.includes('EMPTY BODY'))
if (empties.length) {
  console.log('\n!!  ' + empties.length + ' post(s) produced NO content. Investigate before importing.')
  process.exitCode = 1
}

console.log('\nNext:')
console.log('  npx sanity dataset import ' + outputPath + ' production --replace')
console.log('  npm run dev   # then diff a few pages against the live site\n')
