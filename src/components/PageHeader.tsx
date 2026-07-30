import Container from './Container'

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string | null
  children?: React.ReactNode
}) {
  return (
    <div className="border-b border-white/20">
      <Container className="py-10 text-center sm:py-14">
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-white/85">
            {description}
          </p>
        ) : null}
        {children}
      </Container>
    </div>
  )
}

export default PageHeader
