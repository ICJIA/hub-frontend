/**
 * Generate the Fuse.js search index from the Strapi API.
 *
 * Usage (local dev):
 *   node scripts/generate-search-index.mjs
 *
 * Writes the index to public/search-index.json so nuxt dev can serve it.
 * The production index is written automatically by the Nitro `compiled` hook
 * in nuxt.config.ts during `nuxt build`.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = resolve(__dirname, '..')

// Resolve env vars (load .env manually if dotenv is not available)
const API_BASE_URL = process.env.VITE_API_BASE_URL || ''
const BEARER_TOKEN = process.env.VITE_API_BEARER_TOKEN || ''

const headers = {
  'Content-Type': 'application/json',
  ...(BEARER_TOKEN && { Authorization: `Bearer ${BEARER_TOKEN}` })
}

/** Strip basic markdown syntax so Fuse matches text content, not symbols. */
function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^>\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Fetch all pages of a Strapi collection endpoint.
 * Returns a flat array of item data objects.
 */
async function fetchAllItems(endpoint) {
  const items = []
  let page = 1
  const pageSize = 100

  while (true) {
    const params = new URLSearchParams({
      populate: '*',
      'pagination[page]': String(page),
      'pagination[pageSize]': String(pageSize),
      sort: 'date:desc'
    })

    const url = `${API_BASE_URL}/api/${endpoint}?${params}`
    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`[${endpoint}] HTTP ${res.status}: ${res.statusText}`)

    const json = await res.json()
    const batch = json.data || []
    items.push(...batch)

    const pagination = json.meta?.pagination
    if (!pagination || page >= pagination.pageCount) break
    page++
  }

  return items
}

async function main() {
  console.log('Building search index...')
  console.log(`  API: ${API_BASE_URL}`)

  const [articles, apps, datasets] = await Promise.all([
    fetchAllItems('articles'),
    fetchAllItems('apps'),
    fetchAllItems('datasets')
  ])

  const resolveUrl = (url) => {
    if (!url) return ''
    return url.startsWith('/') ? `${API_BASE_URL}${url}` : url
  }

  const index = [
    ...articles.map(a => ({
      id: a.id,
      type: 'article',
      slug: a.slug ?? '',
      title: a.title ?? '',
      summary: a.abstract ?? '',
      content: stripMarkdown(a.markdown ?? '').slice(0, 3000),
      categories: Array.isArray(a.categories) ? a.categories.filter(Boolean) : [],
      authors: Array.isArray(a.authors)
        ? a.authors.map(x => (typeof x === 'string' ? x : (x?.title || x?.name || x?.Name || '')).trim()).filter(Boolean)
        : [],
      date: a.date ?? '',
      imageUrl: resolveUrl(a.splash?.url ?? '')
    })),
    ...apps.map(a => ({
      id: a.id,
      type: 'app',
      slug: a.slug ?? '',
      title: a.title ?? '',
      summary: a.description ?? '',
      content: '',
      categories: Array.isArray(a.categories) ? a.categories.filter(Boolean) : [],
      authors: Array.isArray(a.contributors)
        ? a.contributors.map(x => (typeof x === 'string' ? x : (x?.name || x?.Name || '')).trim()).filter(Boolean)
        : [],
      date: a.date ?? '',
      imageUrl: resolveUrl(Array.isArray(a.image) ? (a.image[0]?.url ?? '') : (a.image?.url ?? ''))
    })),
    ...datasets.map(d => ({
      id: d.id,
      type: 'dataset',
      slug: d.slug ?? '',
      title: d.title ?? '',
      summary: d.description ?? '',
      content: '',
      categories: Array.isArray(d.categories) ? d.categories.filter(Boolean) : [],
      authors: [],
      date: d.date ?? '',
      imageUrl: ''
    }))
  ]

  const publicDir = join(rootDir, 'public')
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })

  const outPath = join(publicDir, 'search-index.json')
  writeFileSync(outPath, JSON.stringify(index))

  console.log(`✓ Search index written to public/search-index.json`)
  console.log(`  ${articles.length} articles · ${apps.length} apps · ${datasets.length} datasets`)
  console.log(`  Total: ${index.length} items`)
}

main().catch(err => {
  console.error('Failed to generate search index:', err)
  process.exit(1)
})
