import { site } from './site'

/**
 * Reproduces the WordPress "Click to Chat for WhatsApp" plugin's per-page
 * greeting messages, read directly off the live site (not guessed or
 * generated from titles) via `scripts/wp-to-sanity.mjs`-adjacent inspection
 * of each page's `ht_ctc_chat_var.pre_filled` value. Most pages use the
 * default; a handful of high-intent product/budget pages had a custom
 * hand-written greeting, preserved verbatim below (including the live site's
 * own punctuation and spacing quirks).
 */
export const WHATSAPP_DEFAULT_MESSAGE = 'Hi, I got this number from your website'

const CUSTOM_MESSAGES: Record<string, string> = {
  'price-of-aluminium-roofing-sheets-in-2026':
    'Hello, how I need the discounted price of aluminium sheets',
  'price-of-stone-coated-gerard-in-lagos-2025':
    'Hi, what is the discounted price for Stone coated roofing sheets?',
  'aluminium-roofing-sheets-types-grades-price':
    'Can I get the latest price of your aluminium sheets?',
  'price-of-pvc-rain-gutter-water-collector':
    'Hello, I need the discounted price of your rain gutter',
  'roof-repainting-in-nigeria': 'Hello, I am interested in your roof coats',
  'asbestos-vs-aluminium-roof': 'Which roof do you suggest I use?',
  'aluminum-long-span-vs-aluminum-step-tiles-vs-metrocoppo':
    'Hello, I need to make enquiry on your aluminium products.',
  'practical-roofing-budget-for-a-3-bedroom-using-aluminium-metrocopo':
    'Hi, how do I budget for metrocopo roofing?',
  'roofing-quotes-for-a-3-bedroom-with-room-parlour-extention':
    'Hi,  I have a similar project; 3-bedroom bungalow with a room and parlour extension',
  'price-of-alu-zinc-in-lagos': 'How much is a bundle of alu zinc now?',
  'practical-cost-of-roofing-a-2-bedroom-using-gerard-in-2025':
    'Hello, I want to budget for my 2-bedroom',
  'aluminium-roofing-in-nigeria': 'I want the pricelist of your aluminium roof',
  'practical-roof-budget-for-a-3-bedroom-in-2025-with-woodwork':
    'Hi, I need to roof my 3-bedroom',
  'roofing-sheets-budgets-for-3-bedroom': 'Hi, I need to budget for my building.',
  'nine-factors-to-consider-when-choosing-a-roofing-material':
    'Hi, what should I budget for my roof?',
}

/** `pathname` is a real Next.js pathname, e.g. `/` or `/price-of-.../`. */
export function whatsappMessageForPathname(pathname: string): string {
  const slug = pathname.replace(/^\/+|\/+$/g, '')
  return CUSTOM_MESSAGES[slug] ?? WHATSAPP_DEFAULT_MESSAGE
}

export function whatsappHref(message: string): string {
  const number = site.business.telephone.replace(/^\+/, '')
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
