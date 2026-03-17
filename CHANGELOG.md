# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-03-17

### Added

- axe-core + Playwright automated WCAG AA testing (`pnpm test`, `pnpm a11y:test`)
- Manual a11y audit script against any URL (`pnpm a11y`)
- Vitest test runner with verbose reporter and per-page pass/fail output
- Auto-discovery of all routes from `app/pages/` — new pages are tested automatically
- Vitest config (`vitest.config.ts`) with verbose reporter and 60s timeout
- Testing section in README

### Changed

- README section order: About R&A Unit → Accessibility → Tech Stack
- Accessibility section promoted to `## Accessibility` heading

### Fixed

- Footer color-contrast WCAG violation (`text-dimmed` → `text-muted`)
- LICENSE copyright year typo (22026 → 2026)

## [0.1.0] - 2026-03-17

### Added

- Initial Nuxt 4 boilerplate with Nuxt UI 4
- Netlify deployment configuration (`netlify.toml`) with static preset
- SEO Open Graph and Twitter Card meta tags via `useSeoMeta()`
- Custom OG image (SVG + PNG) for social sharing
- Dark mode as default color mode
- Skip-to-content link for keyboard navigation
- WCAG AA 2.1 accessibility compliance
- `@nuxt/a11y` module for accessibility auditing
- README with project description, tech stack, and R&A Unit background
- MIT license
- This changelog
