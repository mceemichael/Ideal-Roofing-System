/**
 * Minimal className joiner. Deliberately not pulling in clsx + tailwind-merge
 * for a site this size - that is 8kb of dependency to concatenate strings.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export default cn
