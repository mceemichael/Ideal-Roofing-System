import { imageSrc } from '../../sanity/image'
import { parseNairaPrice } from './schema'

/**
 * Builds the stone-coated "design grid" (one card per design, colour
 * swatches that swap the photo) from content that is already on the page:
 * the imageCarousel block's slides supply the photos and colour names, the
 * priceTable block supplies the prices. Nothing is invented here — a design
 * with no row in the table simply shows no price.
 */

export type DesignPrice = { thickness: string; price: string; stock: string }

export type DesignColour = {
  name: string
  src: string
  alt: string
  /** Up to two keys into SWATCH_CLASSES in DesignGrid (base, then accent). */
  swatch: string[]
  prices: DesignPrice[]
}

export type Design = { name: string; colours: DesignColour[] }

const DEFAULT_COLOUR = 'Black'
const SWATCH_KEYWORDS = ['wine', 'coffee', 'black', 'white']

function compact(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** "Bond (Coffee Black)" → { base: "Bond", variant: ["coffee", "black"] } */
function splitRowType(type: string): { base: string; variant: string[] } {
  const match = type.match(/^(.*?)\s*\((.*)\)\s*$/)
  if (!match) return { base: type.trim(), variant: [] }
  return {
    base: match[1].trim(),
    variant: match[2].toLowerCase().split(/[^a-z]+/).filter(Boolean),
  }
}

/** Drops the design name off the front of a slide heading, leaving the colour. */
function colourFromHeading(heading: string, design: string): string {
  let remaining = compact(design).length
  let i = 0
  while (i < heading.length && remaining > 0) {
    if (/[a-z0-9]/i.test(heading[i])) remaining--
    i++
  }
  return heading
    .slice(i)
    .replace(/\b(design|colour|color)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function swatchFor(colour: string): string[] {
  const lower = colour.toLowerCase()
  return SWATCH_KEYWORDS.map((key) => ({ key, at: lower.indexOf(key) }))
    .filter((k) => k.at >= 0)
    .sort((a, b) => a.at - b.at)
    .slice(0, 2)
    .map((k) => k.key)
}

export function splitAtCarousel(body: unknown): {
  before: any[]
  carousel: any | null
  after: any[]
} {
  const blocks: any[] = Array.isArray(body) ? body : []
  const at = blocks.findIndex((b) => b?._type === 'imageCarousel')
  if (at < 0) return { before: blocks, carousel: null, after: [] }
  return { before: blocks.slice(0, at), carousel: blocks[at], after: blocks.slice(at + 1) }
}

export function designsFromBody(body: unknown): Design[] {
  const blocks: any[] = Array.isArray(body) ? body : []
  const slides: any[] = blocks.find((b) => b?._type === 'imageCarousel')?.slides || []
  const table = blocks.find((b) => b?._type === 'priceTable')

  const rows = ((table?.rows || []) as Array<{ cells?: string[] }>)
    .map((row) => {
      const [type = '', thickness = '', price = '', stock = ''] = row.cells || []
      return { ...splitRowType(String(type)), thickness, price, stock }
    })
    .filter((row) => row.base && parseNairaPrice(String(row.price)) != null)

  const names = Array.from(new Set(rows.map((r) => r.base)))
  const designs = new Map<string, Design>(
    names.map((name) => [name, { name, colours: [] }])
  )

  for (const slide of slides) {
    const src = imageSrc(slide.image, 800)
    const heading = String(slide.heading || '').trim()
    if (!src || !heading) continue

    // Longest match first, so "Romania" is not swallowed by "Roman".
    const name =
      names
        .filter((n) => compact(heading).startsWith(compact(n)))
        .sort((a, b) => b.length - a.length)[0] || heading
    if (!designs.has(name)) designs.set(name, { name, colours: [] })

    const colour = colourFromHeading(heading, name) || DEFAULT_COLOUR
    const lower = colour.toLowerCase()
    const own = rows.filter((r) => r.base === name)
    const variant = own.filter(
      (r) => r.variant.length && r.variant.every((word) => lower.includes(word))
    )
    const prices = (variant.length ? variant : own.filter((r) => !r.variant.length)).map(
      ({ thickness, price, stock }) => ({ thickness, price, stock })
    )

    const design = designs.get(name)!
    const entry: DesignColour = {
      name: colour,
      src,
      alt: slide.alt || slide.image?.alt || name + ' ' + colour + ' stone-coated roofing sheet',
      swatch: swatchFor(colour),
      prices,
    }
    // The plain design photo leads; named colours follow in slide order.
    if (colour === DEFAULT_COLOUR) design.colours.unshift(entry)
    else design.colours.push(entry)
  }

  return Array.from(designs.values()).filter((d) => d.colours.length)
}
