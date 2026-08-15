import { useEffect, useState } from 'react'
import { useDocumentOperation, type DocumentActionComponent } from 'sanity'

/**
 * Replaces the default Publish button on posts and pages: writes `updatedAt`
 * (sitemap lastmod + "Updated" byline) then publishes. New posts already get
 * an initial publishedAt; this keeps last-updated honest on every later edit.
 */
export const PublishWithTimestamp: DocumentActionComponent = (props) => {
  const { patch, publish } = useDocumentOperation(props.id, props.type)
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    if (isPublishing && !props.draft) setIsPublishing(false)
  }, [isPublishing, props.draft])

  return {
    disabled: Boolean(publish.disabled) || isPublishing,
    label: isPublishing ? 'Publishing…' : 'Publish',
    onHandle: () => {
      setIsPublishing(true)
      patch.execute([{ set: { updatedAt: new Date().toISOString() } }])
      publish.execute()
      props.onComplete()
    },
  }
}

PublishWithTimestamp.action = 'publish'
