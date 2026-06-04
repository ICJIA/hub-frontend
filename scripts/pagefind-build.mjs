/**
 * Post-build script: generates the pagefind search index from the compiled
 * static site output. Run after `nuxt build` via `pnpm pagefind:build`,
 * or together with `pnpm build:full`.
 *
 * Optionally downloads PDF and Excel/CSV attachments from Strapi, then converts
 * them to HTML stubs so pagefind can index their text content.
 * (Pagefind v1.x only processes HTML files, not PDFs directly.)
 */

import { execSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = resolve(__dirname, '..')
const siteDir = join(rootDir, '.output', 'public')

if (!existsSync(siteDir)) {
  console.error(`\n✗ Site directory not found: ${siteDir}`)
  console.error('  Run `pnpm build` first to generate the static site.\n')
  process.exit(1)
}

// Optionally download PDF and Excel/CSV attachments so pagefind can index them
const apiBaseUrl = process.env.VITE_API_BASE_URL
const bearerToken = process.env.API_BEARER_TOKEN
// Per-file fetch timeout — override with ATTACHMENT_TIMEOUT_MS for slow connections
const timeoutMs = Number(process.env.ATTACHMENT_TIMEOUT_MS) || 120_000
if (apiBaseUrl && bearerToken) {
  console.log(`\n⚙  Downloading PDF attachments for indexing (per-file timeout: ${Math.round(timeoutMs / 1000)}s)...`)
  try {
    const { downloadAttachments } = await import('./lib/download-pdf-attachments.mjs')
    await downloadAttachments({ siteDir, apiBaseUrl, bearerToken, timeoutMs })
  } catch (e) {
    console.warn('  PDF attachment download failed (non-fatal):', e.message)
    console.warn('  Continuing without PDF content in index.\n')
  }

  console.log('\n⚙  Processing Excel/CSV attachments for indexing...')
  try {
    const { downloadExcelAttachments } = await import('./lib/download-excel-attachments.mjs')
    await downloadExcelAttachments({ siteDir, apiBaseUrl, bearerToken, timeoutMs })
  } catch (e) {
    console.warn('  Excel/CSV attachment processing failed (non-fatal):', e.message)
    console.warn('  Continuing without Excel/CSV content in index.\n')
  }
} else {
  console.log('\n  VITE_API_BASE_URL / API_BEARER_TOKEN not set — skipping attachment downloads.')
}

// Convert downloaded PDFs to HTML stubs so pagefind can index their text.
// This runs even without API keys — it works on whatever PDFs are already cached.
console.log('\n⚙  Generating HTML stubs from PDF attachments...')
try {
  const { generatePdfStubs } = await import('./lib/generate-pdf-stubs.mjs')
  await generatePdfStubs({ siteDir })
} catch (e) {
  console.warn('  PDF stub generation failed (non-fatal):', e.message)
  console.warn('  Continuing without PDF content in index.\n')
}

// Run pagefind over HTML only — PDFs are not processable by pagefind directly;
// their content is indexed via the HTML stubs generated above.
const pagefindBin = join(rootDir, 'node_modules', '.bin', 'pagefind')
const pagefindArgs = [
  `--site "${siteDir}"`,
  `--output-path "${join(siteDir, 'pagefind')}"`,
  '--glob "**/*.html"'
].join(' ')

console.log('\n⚙  Building pagefind index...')
execSync(`"${pagefindBin}" ${pagefindArgs}`, { stdio: 'inherit', cwd: rootDir })
console.log('✓ Pagefind index written to .output/public/pagefind/\n')
