/**
 * Downloads PDF attachments from the Strapi media library into the
 * compiled site directory so pagefind can index their text content.
 *
 * PDFs are written to <siteDir>/attachments/<hash>.pdf.
 * Existing files are skipped (idempotent).
 *
 * Called from scripts/pagefind-build.mjs when VITE_API_BASE_URL and
 * API_BEARER_TOKEN are present in the environment.
 */

import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * @param {{ siteDir: string, apiBaseUrl: string, bearerToken: string }} options
 */
export async function downloadAttachments({ siteDir, apiBaseUrl, bearerToken }) {
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bearerToken}`
  }

  const destDir = join(siteDir, 'attachments')
  mkdirSync(destDir, { recursive: true })

  let page = 1
  let downloaded = 0
  let skipped = 0
  const PAGE_SIZE = 50

  while (true) {
    const params = new URLSearchParams({
      'filters[ext][$eq]': '.pdf',
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

      // Stable local filename uses the Strapi hash so renames don't cause duplicates
      const localName = `${file.hash}${file.ext ?? '.pdf'}`
      const localPath = join(destDir, localName)

      if (existsSync(localPath)) {
        skipped++
        continue
      }

      const fileRes = await fetch(remoteUrl, { headers: authHeaders })
      if (!fileRes.ok) {
        console.warn(`  Skipping "${file.name}": HTTP ${fileRes.status}`)
        continue
      }

      const buffer = await fileRes.arrayBuffer()
      writeFileSync(localPath, Buffer.from(buffer))
      downloaded++
      console.log(`  + ${file.name} → attachments/${localName}`)
    }

    page++
    if (files.length < PAGE_SIZE) break
  }

  if (downloaded > 0) {
    console.log(`✓ Downloaded ${downloaded} PDF(s), skipped ${skipped} already-cached.`)
  } else {
    console.log(`  No new PDFs found (${skipped} already cached).`)
  }
}
