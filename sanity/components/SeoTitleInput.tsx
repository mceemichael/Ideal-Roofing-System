import type { StringInputProps } from 'sanity'
import { Stack } from '@sanity/ui'
import { CharCountBar } from './CharCountBar'
import { TITLE_MAX, TITLE_MIN } from '../lib/seoScore'

/**
 * Wraps the plain string input Studio would render anyway — `renderDefault`
 * keeps every bit of default behaviour (validation, focus, keyboard nav) —
 * and adds the live character counter Rank Math had, which is the whole
 * reason this file exists: without it, there's no way to tell a title has
 * gone past what Google actually shows in search results.
 */
export function SeoTitleInput(props: StringInputProps) {
  const length = (props.value || '').length

  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <CharCountBar length={length} min={TITLE_MIN} max={TITLE_MAX} />
    </Stack>
  )
}
