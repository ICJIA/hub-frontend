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

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildIndex } from './lib/build-search-index.mjs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = resolve(__dirname, '..')

// Load .env when present (local dev). CI/Netlify inject env vars directly.
const dotenvPath = join(rootDir, '.env')
if (existsSync(dotenvPath)) {
  for (const line of readFileSync(dotenvPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
}

const apiBaseUrl = process.env.VITE_API_BASE_URL || ''
const bearerToken = process.env.VITE_API_BEARER_TOKEN || ''

console.log('Building search index...')
console.log(`  API: ${apiBaseUrl}`)

const { index, fileParents, counts } = await buildIndex({ apiBaseUrl, bearerToken })

const publicDir = join(rootDir, 'public')
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })
writeFileSync(join(publicDir, 'search-index.json'), JSON.stringify(index))
writeFileSync(join(publicDir, 'file-parents.json'), JSON.stringify(fileParents))

console.log(`✓ Search index written to public/search-index.json`)
console.log(`  ${counts.articles} articles · ${counts.apps} apps · ${counts.datasets} datasets`)
console.log(`  Total: ${index.length} items · ${Object.keys(fileParents).length} file → parent mappings`)
