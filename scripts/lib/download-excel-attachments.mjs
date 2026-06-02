/**
 * Downloads Excel/CSV attachments from the Strapi media library and generates
 * HTML stub pages so pagefind can index their text content.
 *
 * Actual files → <siteDir>/attachments/<hash><ext>
 * HTML stubs   → <siteDir>/attachments/excel/<hash>.html
 * Existing stubs are skipped (idempotent).
 *
 * Called from scripts/pagefind-build.mjs when VITE_API_BASE_URL and
 * API_BEARER_TOKEN are present.
 */

import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const EXCEL_EXTS = ['.xlsx', '.xls', '.csv']

/**
 * @param {{ siteDir: string, apiBaseUrl: string, bearerToken: string }} options
 */
export async function downloadExcelAttachments({ siteDir, apiBaseUrl, bearerToken }) {
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bearerToken}`
  }

  const attachDir = join(siteDir, 'attachments')
  const stubDir = join(siteDir, 'attachments', 'excel')
  mkdirSync(attachDir, { recursive: true })
  mkdirSync(stubDir, { recursive: true })

  let downloaded = 0
  let skipped = 0

  for (const ext of EXCEL_EXTS) {
    let page = 1
    const PAGE_SIZE = 50

    while (true) {
      const params = new URLSearchParams({
        'filters[ext][$eq]': ext,
        'pagination[page]': String(page),
        'pagination[pageSize]': String(PAGE_SIZE)
      })

      const res = await fetch(`${apiBaseUrl}/api/upload/files?${params}`, { headers: authHeaders })
      if (!res.ok) throw new Error(`Strapi upload API HTTP ${res.status}: ${res.statusText}`)

      const files = await res.json()
      if (!files?.length) break

      for (const file of files) {
        const remoteUrl = file.url?.startsWith('/') ? `${apiBaseUrl}${file.url}` : file.url
        if (!remoteUrl) continue

        const localName = `${file.hash}${file.ext ?? ext}`
        const localPath = join(attachDir, localName)
        const stubPath = join(stubDir, `${file.hash}.html`)

        if (existsSync(stubPath)) {
          skipped++
          continue
        }

        const fileRes = await fetch(remoteUrl, { headers: authHeaders })
        if (!fileRes.ok) {
          console.warn(`  Skipping "${file.name}": HTTP ${fileRes.status}`)
          continue
        }

        const buffer = await fileRes.arrayBuffer()
        const fileBuffer = Buffer.from(buffer)

        if (!existsSync(localPath)) {
          writeFileSync(localPath, fileBuffer)
        }

        // Extract plain text from the file for indexing
        let textContent = ''
        try {
          if (ext === '.csv') {
            textContent = fileBuffer.toString('utf-8')
          } else {
            const { read, utils } = await import('xlsx')
            const workbook = read(fileBuffer, { type: 'buffer' })
            const parts = []
            for (const sheetName of workbook.SheetNames) {
              const sheet = workbook.Sheets[sheetName]
              // Convert sheet to space-separated values for indexing
              const csv = utils.sheet_to_csv(sheet, { FS: ' ', RS: ' ' })
              if (csv.trim()) parts.push(`${sheetName}: ${csv}`)
            }
            textContent = parts.join(' ')
          }
        } catch (e) {
          console.warn(`  Could not extract text from "${file.name}": ${e.message}`)
        }

        // Normalise whitespace and cap length to avoid huge index entries
        textContent = textContent.replace(/\s+/g, ' ').trim().slice(0, 100_000)

        const displayName = file.name ?? localName
        writeFileSync(stubPath, buildStub(displayName, localName, textContent))

        downloaded++
        console.log(`  + ${file.name} → attachments/excel/${file.hash}.html`)
      }

      page++
      if (files.length < PAGE_SIZE) break
    }
  }

  if (downloaded > 0) {
    console.log(`✓ Processed ${downloaded} Excel/CSV file(s), skipped ${skipped} already-cached.`)
  } else {
    console.log(`  No new Excel/CSV files found (${skipped} already cached).`)
  }
}

function buildStub(displayName, localName, textContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(displayName)}</title>
  <meta name="robots" content="noindex,nofollow">
</head>
<body>
  <h1 data-pagefind-meta="title">${esc(displayName)}</h1>
  <a data-pagefind-meta="fileUrl[href]" href="/attachments/${esc(localName)}">Download</a>
  <span data-pagefind-meta="fileType" hidden>excel</span>
  <div data-pagefind-body>${esc(textContent)}</div>
</body>
</html>`
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
