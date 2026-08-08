import { Box, Flex, Text } from '@sanity/ui'

/**
 * The little "42/60" counter + coloured progress bar Rank Math shows under
 * its title/description fields. Shared by SeoTitleInput and
 * SeoDescriptionInput so both stay visually identical.
 */
export function CharCountBar({
  length,
  min,
  max,
}: {
  length: number
  min: number
  max: number
}) {
  const tone = length === 0 ? 'default' : length > max ? 'critical' : length < min ? 'caution' : 'positive'

  const message =
    length === 0
      ? 'Empty — Google will generate one automatically, which usually ranks worse.'
      : length > max
        ? 'Too long — Google will likely cut this off in search results.'
        : length < min
          ? 'A bit short — there is room to say more.'
          : 'Good length.'

  const pct = Math.min(100, Math.round((length / max) * 100))

  return (
    <Box marginTop={2}>
      <Flex align="center" justify="space-between" marginBottom={1}>
        <Text size={1} muted>
          {message}
        </Text>
        <Text size={1} weight="medium" muted={tone === 'default'}>
          {length} / {max}
        </Text>
      </Flex>
      <Box
        style={{
          height: 4,
          borderRadius: 2,
          background: 'var(--card-border-color)',
          overflow: 'hidden',
        }}
      >
        <Box
          style={{
            height: '100%',
            width: pct + '%',
            borderRadius: 2,
            background:
              tone === 'critical'
                ? 'var(--card-badge-critical-fg-color, #e53e3e)'
                : tone === 'caution'
                  ? 'var(--card-badge-caution-fg-color, #d69e2e)'
                  : tone === 'positive'
                    ? 'var(--card-badge-positive-fg-color, #2f855a)'
                    : 'var(--card-border-color)',
            transition: 'width 120ms ease',
          }}
        />
      </Box>
    </Box>
  )
}
