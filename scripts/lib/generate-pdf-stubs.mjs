/**
 * Generates HTML stub pages from downloaded PDF attachments so pagefind can
 * index their text content. Mirrors the pattern used for Excel stubs.
 *
 * Reads PDFs from <siteDir>/attachments/*.pdf
 * Writes stubs to   <siteDir>/attachments/pdf/<hash>.html
 * Existing stubs are skipped (idempotent).
 *
 * Text is extracted using pdfjs-dist (already a project dependency).
 * If extraction fails for a file the stub is still written with empty body —
 * pagefind will at least index the filename/title.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

// pdfjs-dist v6 requires pointing workerSrc at the actual worker file.
// In Node.js, pdfjs will spin it up as a worker_threads thread.
const WORKER_SRC = fileURLToPath(
  new URL('../../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs', import.meta.url)
)

async function extractPdfText(pdfPath, timeoutMs = 60_000) {
  const controller = new AbortController()
  const { signal } = controller
  let timeoutId

  const timeoutPromise = new Promise((resolve) => {
    timeoutId = setTimeout(() => {
      controller.abort()
      resolve('')
    }, timeoutMs)
  })

  const doExtract = async () => {
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs')
    GlobalWorkerOptions.workerSrc = WORKER_SRC

    const data = readFileSync(pdfPath)
    const doc = await getDocument({
      data: new Uint8Array(data),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: true,
      verbosity: 0
    }).promise

    const parts = []
    for (let i = 1; i <= doc.numPages; i++) {
      if (signal.aborted) break
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const text = content.items
        .filter(item => typeof item.str === 'string' && item.str.trim())
        .map(item => item.str)
        .join(' ')
      if (text.trim()) parts.push(text)
    }

    // doc.destroy() was removed in pdfjs-dist v6
    if (typeof doc.destroy === 'function') await doc.destroy()
    return parts.join('\n').replace(/\s+/g, ' ').trim().slice(0, 500_000)
  }

  try {
    const result = await Promise.race([doExtract(), timeoutPromise])
    clearTimeout(timeoutId)
    return result
  } catch (err) {
    clearTimeout(timeoutId)
    console.warn(`  ⚠ PDF extraction error (${pdfPath}): ${err.message}`)
    return ''
  }
}

/**
 * @param {{ siteDir: string }} options
 */
export async function generatePdfStubs({ siteDir }) {
  const attachDir = join(siteDir, 'attachments')
  const stubDir = join(siteDir, 'attachments', 'pdf')

  if (!existsSync(attachDir)) {
    console.log('  No attachments directory found, skipping PDF stubs.')
    return
  }

  mkdirSync(stubDir, { recursive: true })

  // Build hash → { name, fileUrl } from the search index for display names
  // and Strapi download URLs.
  const fileMetaByHash = new Map()
  const indexPath = join(siteDir, 'search-index.json')
  if (existsSync(indexPath)) {
    try {
      const items = JSON.parse(readFileSync(indexPath, 'utf-8'))
      for (const item of items) {
        for (const f of item.files ?? []) {
          if (f.hash && f.fileType === 'pdf') {
            fileMetaByHash.set(f.hash, { name: f.name, fileUrl: f.fileUrl })
          }
        }
      }
    } catch (err) {
      console.warn(`  ⚠ Could not parse search-index.json: ${err.message}`)
    }
  }

  const pdfFiles = readdirSync(attachDir).filter(f => f.endsWith('.pdf'))
  let processed = 0
  let skipped = 0

  for (const fileName of pdfFiles) {
    const hash = basename(fileName, '.pdf')
    const stubPath = join(stubDir, `${hash}.html`)

    if (existsSync(stubPath)) {
      skipped++
      continue
    }

    const pdfPath = join(attachDir, fileName)
    const meta = fileMetaByHash.get(hash) ?? {
      name: fileName,
      fileUrl: `/attachments/${fileName}`
    }

    process.stdout.write(`  ⇣ ${meta.name} ...`)
    const text = await extractPdfText(pdfPath)

    writeFileSync(
      stubPath,
      buildStub(meta.name, `/attachments/${fileName}`, meta.fileUrl, text)
    )
    processed++
    process.stdout.write(` ${text.length > 0 ? `${text.length} chars` : 'no text extracted'} → attachments/pdf/${hash}.html\n`)
  }

  console.log(`✓ PDF stubs: ${processed} created, ${skipped} cached.`)
}

function buildStub(displayName, _localUrl, strapiUrl, textContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(displayName)}</title>
  <meta name="robots" content="noindex,nofollow">
</head>
<body>
  <h1 data-pagefind-meta="title">${esc(displayName)}</h1>
  <a data-pagefind-meta="fileUrl[href]" href="${esc(strapiUrl)}">Download</a>
  <span data-pagefind-meta="fileType" hidden>pdf</span>
  <div data-pagefind-body>${esc(textContent)}</div>
</body>
</html>`
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
