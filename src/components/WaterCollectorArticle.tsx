import Image from 'next/image'

import PortableBody from './PortableBody'
import { normalizeHeadingOrder } from '@/lib/headings'

const SLUG = 'price-of-pvc-rain-gutter-water-collector'

/**
 * Photo guide for the PVC gutter pricelist. Renders the white sample
 * board and skips the older blue product cards still stored in Sanity.
 */
export function isWaterCollectorPricelist(slug: string): boolean {
  return slug === SLUG
}

function plain(block: { children?: Array<{ text?: string }> }): string {
  return (block.children || []).map((child) => child.text || '').join('')
}

function splitPhotoGuide(blocks: any[]): { before: any[]; after: any[] } | null {
  const start = blocks.findIndex((block) => {
    if (block?._type !== 'block' || block.style !== 'h2') return false
    return /photo guide/i.test(plain(block))
  })
  if (start < 0) return null

  let index = start + 1
  while (index < blocks.length && blocks[index]?._type === 'block' && blocks[index].style === 'normal') {
    index += 1
  }
  while (index < blocks.length && blocks[index]?._type === 'legacyImage') {
    index += 1
  }

  return {
    before: blocks.slice(0, start + 1),
    after: blocks.slice(index),
  }
}

export function WaterCollectorArticle({ body }: { body: unknown }) {
  const blocks = (normalizeHeadingOrder(body, 1) as any[]) || []
  const parts = splitPhotoGuide(blocks)

  if (!parts) {
    return <PortableBody value={blocks} />
  }

  return (
    <>
      <PortableBody value={parts.before} />
      <p className="my-5 leading-[1.75] text-white">
        The white sheet below is the sample board for these parts. Each fitting is labelled on the sheet.
      </p>

      {/* Break out of the 760px text column to the page container so the
          printed labels stay readable. On a phone the sheet keeps its width
          and scrolls sideways instead of shrinking. */}
      <figure className="relative left-1/2 my-8 w-[calc(100vw-2rem)] min-w-0 max-w-[calc(1140px-3rem)] -translate-x-1/2 sm:w-[calc(100vw-3rem)]">
        <div className="min-w-0 overflow-x-auto rounded-lg bg-white">
          <Image
            src="/water-collector/samples.webp"
            alt="Ideal Roofing System PVC water collector sample sheet on a white background. Labelled parts: rain gutter, downpipe, binding wire, elbow 65 degrees, pipe joint socket, internal corner, outlet funnel, gutter joint, clip, hanger, diverter, end cap, external corner, Big Gum, and sealant. 83 Dopemu Rd, Orile Agege, Lagos. 080-5943-1517. www.idealroofingsystem.com."
            width={2245}
            height={1587}
            sizes="(max-width: 1140px) 1000px, 1100px"
            className="block h-auto w-full min-w-[1000px] max-w-none bg-white"
          />
        </div>
        <figcaption className="mt-2 text-center text-sm text-white/85 sm:hidden">
          Swipe sideways to see the whole sheet.
        </figcaption>
      </figure>

      <PortableBody value={parts.after} />
    </>
  )
}

export default WaterCollectorArticle
