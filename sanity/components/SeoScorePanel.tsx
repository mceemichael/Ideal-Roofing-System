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
              Checklist
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
