#!/usr/bin/env node
/**
 * Pre-cutover verification gate.
 *
 *   node scripts/verify-urls.mjs https://your-preview.vercel.app
 *   node scripts/verify-urls.mjs --diff https://idealroofingsystem.com https://your-preview.vercel.app
 *
 * Mode 1 (status check): every known URL returns 200 or an intended 301.
 * Mode 2 (--diff):       compares word counts between old and new to catch
 *                        content that was silently truncated during import.
 *
 * Do not touch DNS until mode 1 is 100% green and mode 2 shows no page losing
 * more than ~5% of its words.
 *
 * The URL list below was captured from the live sitemap on the audit date. If
 * you publish anything new before cutover, re-fetch sitemap_index.xml and add
 * it here.
 */

import { writeFileSync } from 'node:fs'

/* ===================================================================== */
/* URL inventory - captured from the live sitemap                        */
/* ===================================================================== */

const POSTS = [
  'blogs-and-projects',
  'price-of-aluminium-roofing-sheets-in-2026',
  'price-of-stone-coated-gerard-in-lagos-2025',
  'why-is-stone-coated-roofing-cheaper',
  'aluminium-roofing-sheets-types-grades-price',
  'price-of-pvc-rain-gutter-water-collector',
  'roof-repainting-in-nigeria',
  'roofing-budget-for-a-4-bedroom-bungalow',
  'choosing-the-best-color-for-your-aluminum-roof',
  'asbestos-vs-aluminium-roof',
  'aluminum-long-span-vs-aluminum-step-tiles-vs-metrocoppo',
  'practical-roofing-budget-for-a-3-bedroom-using-aluminium-metrocopo',
  'roofing-quotes-for-a-3-bedroom-with-room-parlour-extention',
  'other-alternatives-to-stone-coated-roofing-sheets',
  'is-stonetiles-gerard-sold-per-squared-metre-or-per-metre',
  'what-is-the-true-name-gerard-stonetiles-metrotiles-or-stonecoated',
  'arabian-roof-secret-roof-flat-roofs',
  'price-of-alu-zinc-in-lagos',
  'best-aluminium-thickness-for-flatroof',
  'the-best-roof-to-use-aluminum-vs-stone-coated-roof',
  'popular-nigerian-roof-styles',
  'how-to-budget-for-a-2-bedroom-bungalow',
  'flat-hidden-roof-design-dos-and-donts-you-need-to-know',
  'practical-cost-of-roofing-a-2-bedroom-using-gerard-in-2025',
  'aluminium-roofing-in-nigeria',
  'how-to-naturally-cool-your-home-in-nigeria',
  'roofing-project-at-ifo-ogun-state-for-a-3-bedroom-flat-and-a-shop',
  'practical-roof-budget-for-a-3-bedroom-in-2025-with-woodwork',
  'other-roofing-alternative-to-aluminum-roof',
  'colour-chart-for-aluminium-roofing-sheet-in-nigeria',
  'practical-roof-budget-for-a-4-bedroom-woodwork-and-stonecoated',
  'privacy-policy',
  'how-to-calculate-your-roof-pitch-a-simple-guide',
  'about-us',
  'roofing-sheets-budgets-for-3-bedroom',
  'roofing-project-in-ikire-osun-state-for-a-very-big-2-bedroom-duplex-and-a-boys-quarters',
  'aluminium-or-zinc-which-is-better',
  'aluminium-roofing',
  'nine-factors-to-consider-when-choosing-a-roofing-material',
]

const PAGES = [
  '', // homepage
  'projects',
  'pricelist',
  'roof-area-calculator',
  'services',
  'thank-you-for-placing-an-order-with-us',
]

const CATEGORIES = [
  'quotation',
  'projectsblog',
  'blogs',
  'aluminium-pricelist',
  'stone-coated-pricelist',
  'pvc',
]

const TAGS = [
  'durable',
  'discover-the-benefits-of-aluminum-roofing-for-your-home-lightweight',
  'energy-efficient',
  'aluminium',
  'aluminium-price',
  'longspan-price',
  'steptiles-price',
  'metrocopo-price',
  'factors-to-consider-when-roofing',
  'roofing-factors',
  'roof-budget',
  'roof-style',
  'roof-type',
  'pricelist-for-gerard',
  'price-of-bond-roofing-sheet',
  'price-of-shingle-roofing-sheet',
  'price-of-stonecoated-in-lagos',
  'price-of-roofing-sheet',
  'price-of-stonetiles',
  'roofing-sheets-budgets-for-a-3-bedroom-bungalow-in-2024',
  'price-of-roofing',
  'stonetiles-or-metcopo',
  'metcopo',
  'metrocopo',
  'most-popular-roof',
  'steptiles-price-in-nigeria',
  'steptiles-in-lagos',
  'metral-longspan',
  'normal-longspan',
  '4-bedroom-bungalow',
  'gerard',
  'stonetiles',
  'stonecoated',
  'gerard-or-stonetiles',
  'stonecoated-or-stonetiles',
  'longspan-vs-metrocopo',
  'privacy-policy',
  'metrocopo-roofing-project',
  'longspan-price-in-lagos',
  'longspan-price-in-nigeria',
  'pvc-rain-gutter',
  'pvc-water-collector',
  'pvc',
  'roofing-budget',
  '3-bedroom-bungalow',
  'roofing-sheet-budget',
  'woodwork-budget',
  'pvc-budget',
  'cost-of-roofing-a-3-bedroom-bungalow-in-2025',
  'cost-of-roofing',
  'flat-roof-construction',
  'flat-roof-design',
  'longspan',
  'cost-of-roofing-a-2-bedroom-in-2025',
]

const AUTHORS = ['mcmichael', 'ruth']

const PAGINATION = [
  'blogs-and-projects/page/2',
  'blogs-and-projects/page/3',
  'blogs-and-projects/page/4',
]

/** URLs that are SUPPOSED to redirect. A 200 here would be the bug. */
const EXPECT_REDIRECT = [
  'sitemap_index.xml',
  'post-sitemap.xml',
  'page-sitemap.xml',
  'category-sitemap.xml',
  'post_tag-sitemap.xml',
  'feed',
]

/** URLs that must exist but are not content pages. */
const INFRA = ['sitemap.xml', 'robots.txt', 'feed.xml']

function buildUrlList() {
  const list = []
  for (const s of PAGES) list.push({ path: '/' + (s ? s + '/' : ''), kind: 'page' })
  for (const s of POSTS) list.push({ path: '/' + s + '/', kind: 'post' })
  for (const s of CATEGORIES) list.push({ path: '/' + s + '/', kind: 'category' })
  for (const s of TAGS) list.push({ path: '/tag/' + s + '/', kind: 'tag' })
  for (const s of AUTHORS) list.push({ path: '/author/' + s + '/', kind: 'author' })
  for (const s of PAGINATION) list.push({ path: '/' + s + '/', kind: 'pagination' })
  return list
}

/* ===================================================================== */
/* HTTP helpers                                                          */
/* ===================================================================== */

const UA = 'IdealRoofingMigrationCheck/1.0'

async function head(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': UA },
    })
    return { status: res.status, location: res.headers.get('location') }
  } catch (err) {
    return { status: 0, error: String(err.message || err) }
  }
}

async function getText(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

/**
 * Strip nav, footer and scripts, then count words. Crude but effective:
 * we are looking for "this page lost 40% of its content", not subtle diffs.
 */
function contentWordCount(html) {
  if (!html) return 0
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
  return stripped.split(/\s+/).filter(Boolean).length
}

function extractTables(html) {
  if (!html) return 0
  return (html.match(/<table[\s>]/gi) || []).length
}

/* ===================================================================== */
/* Modes                                                                 */
/* ===================================================================== */

const C = {
  green: (s) => '\x1b[32m' + s + '\x1b[0m',
  red: (s) => '\x1b[31m' + s + '\x1b[0m',
  yellow: (s) => '\x1b[33m' + s + '\x1b[0m',
  dim: (s) => '\x1b[2m' + s + '\x1b[0m',
  bold: (s) => '\x1b[1m' + s + '\x1b[0m',
}

async function runStatusCheck(base) {
  const urls = buildUrlList()
  console.log(C.bold('\nChecking ' + urls.length + ' content URLs against ' + base + '\n'))

  const failures = []
  const redirects = []
  let ok = 0
  let done = 0

  // Modest concurrency: fast enough, gentle enough not to trip rate limits.
  const CONCURRENCY = 8
  const queue = [...urls]

  async function worker() {
    while (queue.length) {
      const item = queue.shift()
      if (!item) break
      const res = await head(base + item.path)
      done++

      if (res.status === 200) {
        ok++
      } else if (res.status >= 300 && res.status < 400) {
        redirects.push({ ...item, ...res })
      } else {
        failures.push({ ...item, ...res })
      }

      if (done % 20 === 0) process.stdout.write(C.dim('  ' + done + '/' + urls.length + '\n'))
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))

  // Infrastructure
  console.log(C.bold('\nInfrastructure:'))
  for (const path of INFRA) {
    const res = await head(base + '/' + path)
    const good = res.status === 200
    console.log(
      '  ' + (good ? C.green('OK  ') : C.red('FAIL')) + '  /' + path + '  ' + res.status
    )
    if (!good) failures.push({ path: '/' + path, kind: 'infra', ...res })
  }

  console.log(C.bold('\nExpected redirects:'))
  for (const path of EXPECT_REDIRECT) {
    const res = await head(base + '/' + path)
    const good = res.status >= 300 && res.status < 400
    console.log(
      '  ' +
        (good ? C.green('OK  ') : C.yellow('WARN')) +
        '  /' +
        path +
        '  ' +
        res.status +
        (res.location ? C.dim('  -> ' + res.location) : '')
    )
  }

  /* ---- Report ---- */
  console.log(C.bold('\n' + '='.repeat(64)))
  console.log(C.bold('  RESULTS'))
  console.log('='.repeat(64))
  console.log('  ' + C.green('200 OK') + '            ' + ok + ' / ' + urls.length)
  console.log('  ' + C.yellow('3xx Redirect') + '      ' + redirects.length)
  console.log('  ' + C.red('Failures') + '          ' + failures.length)

  if (redirects.length) {
    console.log(C.yellow('\nUnexpected redirects (each one dilutes link equity):'))
    for (const r of redirects) {
      console.log('  ' + r.status + '  ' + r.path + C.dim('  -> ' + (r.location || '?')))
    }
    console.log(
      C.dim(
        '\n  A redirect here usually means a trailing-slash mismatch. Check that\n' +
          '  trailingSlash: true is still set in next.config.mjs.'
      )
    )
  }

  if (failures.length) {
    console.log(C.red('\nFAILURES - do not cut over DNS until these are fixed:'))
    for (const f of failures) {
      console.log('  ' + (f.status || 'ERR') + '  [' + f.kind + ']  ' + f.path)
    }
  }

  writeFileSync(
    'verify-report.json',
    JSON.stringify({ base, checkedAt: new Date().toISOString(), ok, redirects, failures }, null, 2)
  )
  console.log(C.dim('\n  Full report written to verify-report.json'))

  if (failures.length) {
    console.log(C.red(C.bold('\n  GATE: FAILED\n')))
    process.exitCode = 1
  } else if (redirects.length) {
    console.log(C.yellow(C.bold('\n  GATE: PASSED WITH WARNINGS\n')))
  } else {
    console.log(C.green(C.bold('\n  GATE: PASSED - safe to proceed\n')))
  }
}

async function runDiff(oldBase, newBase) {
  const urls = buildUrlList().filter((u) => u.kind === 'post' || u.kind === 'page')
  console.log(C.bold('\nContent diff: ' + oldBase + '  vs  ' + newBase))
  console.log(C.dim('Comparing ' + urls.length + ' content pages. This takes a minute.\n'))

  const problems = []

  for (const item of urls) {
    const [oldHtml, newHtml] = await Promise.all([
      getText(oldBase + item.path),
      getText(newBase + item.path),
    ])

    if (!oldHtml) {
      console.log(C.dim('  skip  ' + item.path + '  (old site unreachable)'))
      continue
    }
    if (!newHtml) {
      console.log(C.red('  MISS  ' + item.path + '  (new site returned nothing)'))
      problems.push({ path: item.path, issue: 'missing on new site' })
      continue
    }

    const oldWords = contentWordCount(oldHtml)
    const newWords = contentWordCount(newHtml)
    const oldTables = extractTables(oldHtml)
    const newTables = extractTables(newHtml)

    const delta = oldWords === 0 ? 0 : ((newWords - oldWords) / oldWords) * 100
    const tableLoss = oldTables > newTables

    let flag = C.green('OK  ')
    if (tableLoss) {
      flag = C.red('TBL ')
      problems.push({
        path: item.path,
        issue: 'lost ' + (oldTables - newTables) + ' table(s)',
        oldTables,
        newTables,
      })
    } else if (delta < -5) {
      flag = C.red('LOSS')
      problems.push({
        path: item.path,
        issue: delta.toFixed(1) + '% fewer words',
        oldWords,
        newWords,
      })
    } else if (delta < -2) {
      flag = C.yellow('WARN')
    }

    console.log(
      '  ' +
        flag +
        '  ' +
        item.path.padEnd(58) +
        C.dim(
          oldWords + ' -> ' + newWords + ' words' +
            (delta ? '  (' + (delta > 0 ? '+' : '') + delta.toFixed(1) + '%)' : '') +
            (oldTables ? '  tables ' + oldTables + '->' + newTables : '')
        )
    )
  }

  console.log(C.bold('\n' + '='.repeat(64)))
  if (problems.length) {
    console.log(C.red(C.bold('  ' + problems.length + ' PAGE(S) LOST CONTENT')))
    console.log('='.repeat(64))
    for (const p of problems) {
      console.log('  ' + p.path)
      console.log(C.dim('      ' + p.issue))
    }
    console.log(
      C.dim(
        '\n  Missing tables on the pricelist pages are the serious case - those\n' +
          '  tables are the content that ranks. Open the post in Sanity Studio and\n' +
          '  check for an htmlEmbed block that should be a priceTable.\n'
      )
    )
    process.exitCode = 1
  } else {
    console.log(C.green(C.bold('  NO CONTENT LOSS DETECTED')))
    console.log('='.repeat(64) + '\n')
  }
}

/* ===================================================================== */
/* Entry                                                                 */
/* ===================================================================== */

const args = process.argv.slice(2)

if (args[0] === '--diff') {
  const oldBase = (args[1] || '').replace(/\/$/, '')
  const newBase = (args[2] || '').replace(/\/$/, '')
  if (!oldBase || !newBase) {
    console.error('Usage: node scripts/verify-urls.mjs --diff <old-base-url> <new-base-url>')
    process.exit(1)
  }
  await runDiff(oldBase, newBase)
} else {
  const base = (args[0] || '').replace(/\/$/, '')
  if (!base) {
    console.error('Usage: node scripts/verify-urls.mjs <base-url>')
    console.error('       node scripts/verify-urls.mjs --diff <old-url> <new-url>')
    process.exit(1)
  }
  await runStatusCheck(base)
}
