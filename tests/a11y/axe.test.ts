import { describe, it, expect } from 'vitest'
import { setup, createPage, url } from '@nuxt/test-utils/e2e'
import AxeBuilder from '@axe-core/playwright'

describe('Accessibility (axe-core)', () => {
  setup({
    browser: true
  })

  it('home page has no WCAG AA violations', async () => {
    const page = await createPage()
    await page.goto(url('/'))
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

    if (violations.length > 0) {
      console.table(violations)
    }

    expect(violations).toHaveLength(0)
  })
})
