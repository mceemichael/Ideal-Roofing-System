import { createClient } from 'next-sanity'
import { type NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { apiVersion, dataset, projectId } from '../../../../../sanity/env'

/**
 * Receives comment submissions and files them in Sanity as UNAPPROVED.
 *
 * Nothing written here is publicly visible until you tick "Approved" in the
 * Studio. That matters: a site ranking for commercial keywords with an open
 * comment form collects spam within days, and auto-published spam is both an
 * embarrassment and an SEO liability.
 *
 * Requires SANITY_API_WRITE_TOKEN — create it at
 * sanity.io/manage -> API -> Tokens, with Editor permissions.
 */

export const runtime = 'nodejs'

const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

/**
 * Crude in-memory rate limit: 3 comments per IP per 10 minutes.
 *
 * Deliberately simple. It resets whenever the serverless function cold-starts,
 * so it will not stop a determined attacker — but combined with the honeypot
 * and manual approval it stops essentially all drive-by spam bots, which is
 * the actual threat. If this ever becomes insufficient, move to Upstash Redis;
 * do not add a CAPTCHA, which costs you real comments from real people.
 */
const recent = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 3

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (recent.get(ip) || []).filter((t) => now - t < WINDOW_MS)
  if (hits.length >= MAX_PER_WINDOW) return true
  hits.push(now)
  recent.set(ip, hits)
  return false
}

function gravatar(email: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex')
  return 'https://secure.gravatar.com/avatar/' + hash + '?s=80&d=mm&r=g'
}

const LINK_RE = /https?:\/\//gi

export async function POST(req: NextRequest) {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    return NextResponse.json(
      { message: 'Comments are not configured yet.' },
      { status: 503 }
    )
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (rateLimited(ip)) {
    return NextResponse.json(
      { message: 'Too many comments. Please try again later.' },
      { status: 429 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 })
  }

  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim()
  const website = String(body.website || '').trim()
  const text = String(body.body || '').trim()
  const documentId = String(body.documentId || '').trim()
  const documentType = String(body.documentType || '').trim()
  const honeypot = String(body.company || '').trim()

  // A filled honeypot means a bot. Return 200 so it thinks it succeeded and
  // moves on, rather than retrying with the field cleared.
  if (honeypot) {
    return NextResponse.json({ ok: true })
  }

  if (!name || !email || !text || !documentId) {
    return NextResponse.json(
      { message: 'Please fill in all required fields.' },
      { status: 400 }
    )
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json(
      { message: 'Please enter a valid email address.' },
      { status: 400 }
    )
  }
  if (name.length > 100 || text.length > 5000) {
    return NextResponse.json({ message: 'That comment is too long.' }, { status: 400 })
  }
  if (documentType !== 'post' && documentType !== 'page') {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 })
  }
  // More than two URLs in a comment is spam essentially every time.
  if ((text.match(LINK_RE) || []).length > 2) {
    return NextResponse.json(
      { message: 'Please remove the links from your comment.' },
      { status: 400 }
    )
  }

  try {
    await writeClient.create({
      _type: 'comment',
      approved: false,
      name,
      email,
      website: website || undefined,
      body: text,
      post: { _type: 'reference', _ref: documentId },
      publishedAt: new Date().toISOString(),
      avatarUrl: gravatar(email),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { message: 'Could not save your comment. Please try again.' },
      { status: 500 }
    )
  }
}
