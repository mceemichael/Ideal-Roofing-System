import { type SchemaTypeDefinition } from 'sanity'

import post from './post'
import page from './page'
import category from './category'
import tag from './tag'
import author from './author'
import siteSettings from './siteSettings'

import seo from './objects/seo'
import legacyImage from './objects/legacyImage'
import htmlEmbed from './objects/htmlEmbed'
import priceTable from './objects/priceTable'
import youtube from './objects/youtube'
import callout from './objects/callout'
import toolEmbed from './objects/toolEmbed'
import comment from './comment'

export const schemaTypes: SchemaTypeDefinition[] = [
  // Documents
  post,
  page,
  category,
  tag,
  author,
  siteSettings,
  comment,
  // Objects
  seo,
  legacyImage,
  htmlEmbed,
  priceTable,
  youtube,
  callout,
  toolEmbed,
]

export default schemaTypes
