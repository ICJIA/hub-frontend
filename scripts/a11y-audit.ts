import { chromium } from 'playwright-core'
import AxeBuilder from '@axe-core/playwright'

const baseUrl = process.argv[2] || 'http://localhost:3000'
const paths = ['/' ]

async function run() {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  let totalViolations = 0

  for (const path of paths) {
    const page = await context.newPage()
    const fullUrl = `${baseUrl}${path}`

    console.log(`\n--- Auditing: ${fullUrl} ---\n`)
    await page.goto(fullUrl, { waitUntil: 'networkidle' })

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()

    if (results.violations.length === 0) {
      console.log('No WCAG AA violations found.')
    } else {
      totalViolations += results.violations.length
      for (const v of results.violations) {
        console.log(`[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`)
        console.log(`  Help: ${v.helpUrl}`)
        console.log(`  Affected: ${v.nodes.length} element(s)`)
        for (const node of v.nodes) {
          console.log(`    - ${node.html.substring(0, 120)}`)
        }
        console.log()
      }
    }

    await page.close()
  }

  await browser.close()

  console.log(`\n=== Audit complete: ${totalViolations} violation(s) found ===\n`)

  if (totalViolations > 0) {
    process.exit(1)
  }
}

run().catch((err) => {
  console.error('Audit failed:', err.message)
  console.error('\nMake sure the dev server is running (pnpm dev) or pass a URL:')
  console.error('  pnpm a11y http://localhost:3000\n')
  process.exit(1)
})
