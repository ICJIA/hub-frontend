import { describe, it, expect } from 'vitest'
import { setup, getBrowser, url } from '@nuxt/test-utils/e2e'
import AxeBuilder from '@axe-core/playwright'
import { globSync } from 'node:fs'
import { resolve } from 'node:path'

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

  for (const route of routes) {
    it(`${route} has no WCAG AA violations`, async () => {
      const browser = await getBrowser()
      const context = await browser.newContext()
      const page = await context.newPage()

      await page.goto(url(route))
      await page.waitForLoadState('networkidle')

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze()

      const violations = results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length
      }))

      await context.close()

      expect(violations, violations.map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes} elements)`).join('\n')).toHaveLength(0)
    })
  }
})
