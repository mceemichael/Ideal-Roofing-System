import type { TextInputProps } from 'sanity'
import { Stack } from '@sanity/ui'
import { CharCountBar } from './CharCountBar'
import { DESCRIPTION_MAX, DESCRIPTION_MIN } from '../lib/seoScore'

/** Same idea as SeoTitleInput, tuned to meta-description length. */
export function SeoDescriptionInput(props: TextInputProps) {
  const length = (props.value || '').length

  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <CharCountBar length={length} min={DESCRIPTION_MIN} max={DESCRIPTION_MAX} />
    </Stack>
  )
}
