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
import { fetchWithTimeout, formatBytes } from './download-utils.mjs'

/**
 * @param {{ siteDir: string, apiBaseUrl: string, bearerToken: string, timeoutMs?: number }} options
 */
export async function downloadAttachments({ siteDir, apiBaseUrl, bearerToken, timeoutMs = 120_000 }) {
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bearerToken}`
  }

  const destDir = join(siteDir, 'attachments')
  mkdirSync(destDir, { recursive: true })

  let page = 1
  let downloaded = 0
  let skipped = 0
  let failed = 0
  let seen = 0
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
      seen++
      const remoteUrl = file.url?.startsWith('/') ? `${apiBaseUrl}${file.url}` : file.url
      if (!remoteUrl) continue

      // Stable local filename uses the Strapi hash so renames don't cause duplicates
      const localName = `${file.hash}${file.ext ?? '.pdf'}`
      const localPath = join(destDir, localName)

      if (existsSync(localPath)) {
        skipped++
        process.stdout.write(`  [${seen}] ⤼ cached: ${file.name}\n`)
        continue
      }

      // Print the fetch start BEFORE the network call so a hang shows here.
      process.stdout.write(`  [${seen}] ⇣ fetching: ${file.name} ...`)
      try {
        const fileRes = await fetchWithTimeout(remoteUrl, { headers: authHeaders }, timeoutMs)
        if (!fileRes.ok) {
          failed++
          process.stdout.write(` HTTP ${fileRes.status}, skipped\n`)
          continue
        }
        const buffer = await fileRes.arrayBuffer()
        writeFileSync(localPath, Buffer.from(buffer))
        downloaded++
        process.stdout.write(` ${formatBytes(buffer.byteLength)} → attachments/${localName}\n`)
      } catch (e) {
        failed++
        const msg = e?.name === 'AbortError' ? `timed out after ${Math.round(timeoutMs / 1000)}s` : e?.message ?? 'unknown error'
        process.stdout.write(` ✗ ${msg}, skipped\n`)
      }
    }

    page++
    if (files.length < PAGE_SIZE) break
  }

  console.log(`✓ PDFs: ${downloaded} downloaded, ${skipped} cached, ${failed} failed (${seen} total seen).`)
}
