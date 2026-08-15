import { useEffect, useMemo, useState } from 'react'
import { IntentLink } from 'sanity/router'
import { useClient } from 'sanity'
import { Badge, Box, Card, Container, Flex, Select, Spinner, Stack, Text } from '@sanity/ui'
import { computeSeoScore, scoreTone, type SeoScoreResult } from '../lib/seoScore'
import { redirects } from '../../src/lib/redirects.js'

const QUERY = `*[_type in ["post", "page"]]{
  _id,
  _type,
  title,
  "slug": slug.current,
  body,
  seo { title, description, focusKeyword }
}`

// Literal (non-templated) redirect sources, as bare slugs. A document whose
// only URL permanently redirects elsewhere is never seen by Google under
// that slug — scoring it here is actively misleading (see "home": WordPress's
// static-front-page mechanism imported the homepage's own content a second
// time as a normal page, which /home/ redirects away from in redirects.js;
// editing that document has zero effect on the real, hardcoded homepage).
const REDIRECTED_SLUGS = new Set(
  (redirects as unknown as Array<{ source: string }>)
    .map((r) => r.source)
    .filter((s) => !s.includes(':'))
    .map((s) => s.replace(/^\/|\/$/g, ''))
)

type Row = {
  _id: string
  _type: string
  title: string
  slug: string
  result: SeoScoreResult
}

/**
 * The site-wide list Michael asked for: every post and page, worst SEO
 * score first, so it's obvious at a glance which pages need attention
 * instead of having to open each one individually.
 *
 * Scores are computed with the exact same `computeSeoScore()` used by the
 * per-document panel and the character-count fields, so a number here
 * always matches what you'd see by opening that document.
 */
export function SeoOverviewTool() {
  const client = useClient({ apiVersion: '2024-01-01' })
  const [docs, setDocs] = useState<any[] | null>(null)
  const [sort, setSort] = useState<'score-asc' | 'score-desc' | 'title'>('score-asc')

  useEffect(() => {
    let cancelled = false
    client.fetch(QUERY).then((result) => {
      if (!cancelled) setDocs(result)
    })
    return () => {
      cancelled = true
    }
  }, [client])

  const rows: Row[] = useMemo(() => {
    if (!docs) return []
    const computed = docs
      .filter((doc) => !REDIRECTED_SLUGS.has(doc.slug || ''))
      .map((doc) => ({
        _id: doc._id,
        _type: doc._type,
        title: doc.title || '(untitled)',
        slug: doc.slug || '',
        result: computeSeoScore(doc),
      }))
    return computed.sort((a, b) => {
      if (sort === 'score-asc') return a.result.score - b.result.score
      if (sort === 'score-desc') return b.result.score - a.result.score
      return a.title.localeCompare(b.title)
    })
  }, [docs, sort])

  if (!docs) {
    return (
      <Flex align="center" justify="center" height="fill" padding={5}>
        <Spinner muted />
      </Flex>
    )
  }

  const average = rows.length
    ? Math.round(rows.reduce((sum, r) => sum + r.result.score, 0) / rows.length)
    : 0

  return (
    <Container width={2} padding={4}>
      <Stack space={4}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Stack space={2}>
            <Text size={3} weight="bold">
              SEO Overview
            </Text>
            <Text size={1} muted>
              {rows.length} pages · average score {average}%. Click a title to edit it.
            </Text>
          </Stack>
          <Select
            value={sort}
            onChange={(e) => setSort(e.currentTarget.value as typeof sort)}
            style={{ width: 220 }}
          >
            <option value="score-asc">Worst score first</option>
            <option value="score-desc">Best score first</option>
            <option value="title">Title A-Z</option>
          </Select>
        </Flex>

        <Stack space={2}>
          {rows.map((row) => (
            <Card key={row._id} padding={3} radius={2} shadow={1}>
              <Flex align="center" justify="space-between" gap={3}>
                <Stack space={2} flex={1}>
                  <IntentLink
                    intent="edit"
                    params={{ id: row._id, type: row._type }}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    <Text weight="medium">{row.title}</Text>
                  </IntentLink>
                  <Text size={1} muted>
                    /{row.slug}/ · {row.result.wordCount} words ·{' '}
                    {row.result.checks.filter((c) => c.passed).length}/{row.result.checks.length} checks passed
                  </Text>
                </Stack>
                <Badge tone={scoreTone(row.result.score)} fontSize={1} padding={3} radius={3}>
                  {row.result.score}%
                </Badge>
              </Flex>
            </Card>
          ))}
        </Stack>

        {!rows.length ? (
          <Box padding={4}>
            <Text muted>No posts or pages found.</Text>
          </Box>
        ) : null}
      </Stack>
    </Container>
  )
}
