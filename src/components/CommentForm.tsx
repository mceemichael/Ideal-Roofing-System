'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

/**
 * Comment submission.
 *
 * Submissions arrive in Sanity unapproved and appear nowhere until you tick
 * "Approved" in the Studio. That is the same posture WordPress had with
 * moderation on, and it is the right one — an open comment form on a site that
 * ranks for commercial keywords attracts spam within days.
 */
export function CommentForm({
  documentId,
  documentType,
}: {
  documentId: string
  documentType: 'post' | 'page'
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setError('')

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          website: data.get('website'),
          body: data.get('body'),
          documentId,
          documentType,
          // Honeypot — see the hidden field below.
          company: data.get('company'),
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.message || 'Something went wrong. Please try again.')
      }

      setStatus('sent')
      form.reset()
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="mt-8 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-5">
        <p className="font-semibold text-ink">Thank you — your comment was received.</p>
        <p className="mt-1 text-sm text-ink-muted">
          It will appear here once we have read it. We check daily.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-10">
      <h3 className="text-lg font-bold text-ink">Leave a reply</h3>
      <p className="mt-1 text-sm text-ink-muted">
        Your email address will not be published. Required fields are marked *
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" label="Name" required autoComplete="name" />
          <Field name="email" label="Email" type="email" required autoComplete="email" />
        </div>

        <Field name="website" label="Website" type="url" autoComplete="url" />

        <div>
          <label htmlFor="comment-body" className="block text-sm font-medium text-ink">
            Comment <span className="text-red-600">*</span>
          </label>
          <textarea
            id="comment-body"
            name="body"
            required
            rows={5}
            maxLength={5000}
            className="mt-1.5 w-full rounded-lg border border-surface-border px-3 py-2.5 text-base text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/*
          Honeypot. Real people never see or fill this; most spam bots fill
          every field they find. Cheaper and less annoying than a CAPTCHA, and
          it doesn't send your visitors' data to a third party.
        */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="comment-company">Company (leave blank)</label>
          <input id="comment-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {status === 'error' ? (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'sending' ? 'Posting…' : 'Post Comment'}
        </button>
      </form>
    </div>
  )
}

function Field({
  name,
  label,
  type = 'text',
  required = false,
  autoComplete,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
}) {
  const id = 'comment-' + name
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label} {required ? <span className="text-red-600">*</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-lg border border-surface-border px-3 py-2.5 text-base text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  )
}

export default CommentForm
