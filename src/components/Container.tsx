import { cn } from '@/lib/cn'

export function Container({
  children,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'header' | 'footer' | 'main' | 'article'
}) {
  return (
    <Tag className={cn('mx-auto w-full max-w-content px-4 sm:px-6', className)}>
      {children}
    </Tag>
  )
}

export default Container
