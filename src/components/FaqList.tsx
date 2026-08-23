export type FaqItem = {
  question?: string | null
  answer?: string | null
}

export function FaqList({ items }: { items?: FaqItem[] | null }) {
  const list = (items || []).filter((f) => f.question && f.answer)
  if (!list.length) return null

  return (
    <section className="mt-12">
      <h2 className="mt-10 mb-4 text-2xl font-bold leading-snug text-white sm:text-[1.75rem]">
        Frequently asked questions
      </h2>
      <dl>
        {list.map((f) => (
          <div key={f.question} className="mb-6">
            <dt>
              <h3 className="mt-8 mb-3 text-xl font-bold leading-snug text-white">
                {f.question}
              </h3>
            </dt>
            <dd className="my-5 leading-[1.75] text-white">{f.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default FaqList
