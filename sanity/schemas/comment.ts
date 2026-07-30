import { defineField, defineType } from 'sanity'

/**
 * Reader comments.
 *
 * Easy to dismiss as optional, but your roof area calculator page carries six
 * of them and they are doing real work: they are unique on-page text that no
 * competitor has, and they are social proof at the exact moment someone is
 * deciding whether to trust your numbers. Dropping them would quietly remove
 * both.
 *
 * Comments are stored as separate documents rather than nested in the post so
 * that a new comment does not require rewriting the post document, and so the
 * moderation queue is a simple filtered list.
 */
export default defineType({
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    defineField({
      name: 'approved',
      title: 'Approved',
      type: 'boolean',
      initialValue: false,
      description:
        'Only approved comments appear on the site. New submissions arrive unapproved — nothing is published until you say so.',
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Never displayed publicly. Used only for the Gravatar and to reply.',
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'string',
      description:
        'Displayed as a nofollow link. WordPress collected this field, so it is preserved for imported comments.',
    }),
    defineField({
      name: 'body',
      title: 'Comment',
      type: 'text',
      rows: 5,
      validation: (Rule) => Rule.required().max(5000),
    }),
    defineField({
      name: 'post',
      title: 'On',
      type: 'reference',
      to: [{ type: 'post' }, { type: 'page' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'parent',
      title: 'Reply to',
      type: 'reference',
      to: [{ type: 'comment' }],
      description: 'Set when this comment is a threaded reply.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Posted at',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'avatarUrl',
      title: 'Gravatar URL',
      type: 'url',
      readOnly: true,
    }),
    defineField({
      name: 'legacyId',
      title: 'WordPress comment ID',
      type: 'number',
      readOnly: true,
      description:
        'Preserved so old anchor links like #comment-468 keep working — those get shared and linked to.',
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'newest',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Awaiting approval',
      name: 'pending',
      by: [
        { field: 'approved', direction: 'asc' },
        { field: 'publishedAt', direction: 'desc' },
      ],
    },
  ],
  preview: {
    select: {
      name: 'name',
      body: 'body',
      approved: 'approved',
      post: 'post.title',
    },
    prepare({ name, body, approved, post }) {
      return {
        title: (approved ? '' : '● ') + name,
        subtitle:
          (post ? post + ' — ' : '') + String(body || '').slice(0, 60),
      }
    },
  },
})
