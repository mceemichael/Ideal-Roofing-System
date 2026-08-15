import { Badge, Box, Card, Container, Flex, Stack, Text } from '@sanity/ui'
import { CheckmarkCircleIcon, CloseCircleIcon } from '@sanity/icons'
import { computeSeoScore, scoreLabel, scoreTone } from '../lib/seoScore'

/**
 * The "SEO Analysis" tab next to the normal editing form on a post/page.
 *
 * `document.displayed` is the live, currently-being-typed version of the
 * document (published version merged with any unsaved draft edits) — this
 * is the officially documented shape Studio passes to a custom document
 * view, not something reconstructed by hand, so the score updates as you
 * type with no save needed. See UserViewComponent in `sanity/structure.d.ts`.
 */
const HINTS: Record<string, string> = {
  titleLength: 'Open the SEO tab and edit Google title until the bar is green.',
  descriptionLength: 'Open the SEO tab and write a Google description of 120–160 characters.',
  hasFocusKeyword: 'On the SEO tab, type the phrase people search for.',
  keywordInTitle: 'Put that same phrase in the Google title.',
  keywordInDescription: 'Mention that phrase in the Google description.',
  keywordInSlug: 'On a new post, click Generate on Web address after the headline includes the phrase. Do not change old addresses.',
  keywordInIntro: 'Use the phrase in the first paragraph of the article.',
  keywordInHeading: 'Use the phrase in an H2 or H3 heading.',
  contentLength: 'Keep writing — aim for at least 300 words, 600 is better.',
  imageAlt: 'Add a photo with Alt text filled in (the short description under the image).',
}

export function SeoScorePanel(props: {
  document: { displayed: Record<string, unknown> }
}) {
  const doc = props.document.displayed as any
  const result = computeSeoScore(doc)
  const color = scoreTone(result.score)

  return (
    <Container width={1} padding={4}>
      <Stack space={4}>
        <Card padding={4} radius={3} tone={color} shadow={1}>
          <Flex align="center" justify="space-between">
            <Stack space={2}>
              <Text size={1} muted>
                On-page SEO score
              </Text>
              <Text size={4} weight="bold">
                {scoreLabel(result.score)}
              </Text>
            </Stack>
            <Text size={6} weight="bold">
              {result.score}%
            </Text>
          </Flex>
        </Card>

        <Card padding={4} radius={3} shadow={1}>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Checklist — fix the red ones on the Write and SEO tabs
            </Text>
            {result.checks.map((check) => (
              <Flex key={check.id} align="flex-start" gap={3}>
                <Box paddingTop={1}>
                  {check.passed ? (
                    <Text size={2} style={{ color: 'var(--card-badge-positive-fg-color, #2f855a)' }}>
                      <CheckmarkCircleIcon />
                    </Text>
                  ) : (
                    <Text size={2} style={{ color: 'var(--card-badge-critical-fg-color, #e53e3e)' }}>
                      <CloseCircleIcon />
                    </Text>
                  )}
                </Box>
                <Stack space={1} flex={1}>
                  <Text size={1}>{check.label}</Text>
                  {check.detail ? (
                    <Text size={1} muted>
                      {check.detail}
                    </Text>
                  ) : null}
                  {!check.passed && HINTS[check.id] ? (
                    <Text size={1} muted>
                      {HINTS[check.id]}
                    </Text>
                  ) : null}
                </Stack>
              </Flex>
            ))}
          </Stack>
        </Card>

        <Card padding={3} radius={3} tone="transparent">
          <Flex gap={2} wrap="wrap">
            <Badge tone="default">{result.wordCount} words</Badge>
            <Badge tone="default">{result.titleLength} title chars</Badge>
            <Badge tone="default">{result.descriptionLength} description chars</Badge>
          </Flex>
        </Card>
      </Stack>
    </Container>
  )
}
