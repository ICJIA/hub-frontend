import { vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { formatDate, truncate } from '../../app/utils/formatters.js'

// ─── Per-test useState store ─────────────────────────────────────────────────
// Mirrors Nuxt's cross-component shared state keyed by state key.
const stateStore = new Map<string, ReturnType<typeof ref>>()

const makeUseState = () =>
  vi.fn().mockImplementation((key: string, init?: () => unknown) => {
    if (!stateStore.has(key)) {
      stateStore.set(key, ref(init?.() ?? null))
    }
    return stateStore.get(key)!
  })

// ─── Nuxt runtime globals ────────────────────────────────────────────────────
// These replicate what Nuxt's auto-import layer injects at build time so
// composables and middleware can be tested without the full Nuxt runtime.
;(globalThis as Record<string, unknown>).useState = makeUseState()
;(globalThis as Record<string, unknown>).$fetch = vi.fn()
;(globalThis as Record<string, unknown>).navigateTo = vi.fn()
;(globalThis as Record<string, unknown>).defineNuxtRouteMiddleware = (
  fn: (...args: unknown[]) => unknown
) => fn

// ─── apiConfig auto-imports ──────────────────────────────────────────────────
;(globalThis as Record<string, unknown>).API_BASE_URL = 'http://localhost:1338'
;(globalThis as Record<string, unknown>).STRAPI_PROXY = '/api/strapi'
;(globalThis as Record<string, unknown>).getHeaders = () => ({
  'Content-Type': 'application/json',
})
;(globalThis as Record<string, unknown>).getHeadersWithAuth = () => ({
  'Content-Type': 'application/json',
  'x-preview-token': '',
})
;(globalThis as Record<string, unknown>).getAuthHeader = () => ({
  'x-preview-token': '',
})

// ─── formatters auto-imports ─────────────────────────────────────────────────
;(globalThis as Record<string, unknown>).formatDate = formatDate
;(globalThis as Record<string, unknown>).truncate = truncate

// ─── Native fetch mock ───────────────────────────────────────────────────────
vi.stubGlobal('fetch', vi.fn())

// ─── Reset per test ──────────────────────────────────────────────────────────
beforeEach(() => {
  stateStore.clear()
  ;(globalThis as Record<string, unknown>).useState = makeUseState()
  vi.mocked(fetch).mockReset()
  vi.mocked((globalThis as Record<string, unknown>).$fetch as ReturnType<typeof vi.fn>).mockReset()
  vi.mocked((globalThis as Record<string, unknown>).navigateTo as ReturnType<typeof vi.fn>).mockReset()
})
