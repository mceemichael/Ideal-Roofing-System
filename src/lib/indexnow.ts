import { site } from './site'
import { absoluteUrl } from './seo'

/**
 * Bing / Yandex IndexNow. The key file at /<key>.txt is how the protocol
 * authenticates — it is meant to be public. Env override is for rotation
 * without a code change; the file in public/ must match.
 */
export const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || 'abddba0e26de41cf843a84d559f0190d'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

export function indexNowKeyLocation(): string {
  return absoluteUrl('/' + INDEXNOW_KEY + '.txt').replace(/\/$/, '')
}

function hostFromSite(): string {
  return site.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

/** Never throws — a failed ping must not fail the revalidate webhook. */
export async function submitIndexNow(
  paths: string[]
): Promise<{ submitted: string[]; status?: number; error?: string }> {
  const urls = Array.from(
    new Set(
      paths
        .filter(Boolean)
        .map((p) => (p.startsWith('http') ? p : absoluteUrl(p.startsWith('/') ? p : '/' + p)))
    )
  )
  if (!urls.length) return { submitted: [] }

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: hostFromSite(),
        key: INDEXNOW_KEY,
        keyLocation: indexNowKeyLocation(),
        urlList: urls,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { submitted: urls, status: res.status, error: text.slice(0, 200) }
    }
    return { submitted: urls, status: res.status }
  } catch (err) {
    return {
      submitted: urls,
      error: err instanceof Error ? err.message : 'indexnow fetch failed',
    }
  }
}
