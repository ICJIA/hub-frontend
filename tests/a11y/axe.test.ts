import { describe, it, expect, afterAll } from 'vitest'
import { setup, getBrowser, url } from '@nuxt/test-utils/e2e'
import AxeBuilder from '@axe-core/playwright'
import { globSync } from 'node:fs'
import { resolve } from 'node:path'

interface PageResult {
  route: string
  status: 'pass' | 'fail'
  violationCount: number
}

function discoverRoutes(): string[] {
  const pagesDir = resolve(process.cwd(), 'app/pages')
  const files = globSync('**/*.vue', { cwd: pagesDir })

  return files.map((file) => {
    const route = file
      .replace(/\.vue$/, '')
      .replace(/\/index$/, '')
      .replace(/index$/, '')
    return '/' + route
  })
}

describe('Accessibility (axe-core)', async () => {
  await setup({
    browser: true
  })

  const routes = discoverRoutes()
  const pageResults: PageResult[] = []

  afterAll(() => {
    const passed = pageResults.filter(r => r.status === 'pass').length
    const failed = pageResults.filter(r => r.status === 'fail').length
    console.log(`\n  a11y summary: ${passed} passed, ${failed} failed (${pageResults.length} pages)\n`)
    for (const r of pageResults) {
      const icon = r.status === 'pass' ? 'PASS' : 'FAIL'
      const detail = r.status === 'fail' ? ` (${r.violationCount} violation(s))` : ''
      console.log(`    [${icon}] ${r.route}${detail}`)
    }
    console.log()
  })

  for (const route of routes) {
    it(`${route} has no WCAG AA violations`, async () => {
      const browser = await getBrowser()
      const context = await browser.newContext()
      const page = await context.newPage()

      await page.goto(url(route))
      await page.waitForLoadState('networkidle')

      const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      const violations = axeResults.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length
      }))

      await context.close()

      const status = violations.length === 0 ? 'pass' as const : 'fail' as const
      pageResults.push({ route, status, violationCount: violations.length })

      expect(violations, violations.map(v => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes} elements)`).join('\n')).toHaveLength(0)
    })
  }
})
