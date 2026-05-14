import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateToken, validateToken } from '../../../app/utils/previewToken.js'

// The middleware default export wraps the route guard in defineNuxtRouteMiddleware.
// Our global mock returns the inner function directly so we can call it.
let middleware: (to: Record<string, unknown>) => unknown

beforeEach(async () => {
  vi.resetModules()
  // Reset sessionStorage before each test
  sessionStorage.clear()
  // Reload the middleware module fresh to avoid stale state
  const mod = await import('../../../app/middleware/preview-access.js')
  middleware = mod.default as (to: Record<string, unknown>) => unknown
})

const makeRoute = (token?: string) => ({
  query: token ? { token } : {},
})

describe('previewAccess middleware – iframe context', () => {
  it('marks session as authorized when in an iframe', () => {
    // Simulate being inside an iframe: window.parent !== window
    Object.defineProperty(window, 'parent', {
      value: {} as Window,
      writable: true,
      configurable: true,
    })
    middleware(makeRoute())
    expect(sessionStorage.getItem('preview_authorized')).toBe('true')
    // Restore
    Object.defineProperty(window, 'parent', { value: window, writable: true, configurable: true })
  })

  it('does not call navigateTo when in an iframe', () => {
    Object.defineProperty(window, 'parent', {
      value: {} as Window,
      writable: true,
      configurable: true,
    })
    middleware(makeRoute())
    expect(vi.mocked((globalThis as Record<string, unknown>).navigateTo as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled()
    Object.defineProperty(window, 'parent', { value: window, writable: true, configurable: true })
  })
})

describe('previewAccess middleware – already authorized session', () => {
  beforeEach(() => {
    // Ensure same-tab context
    Object.defineProperty(window, 'parent', { value: window, writable: true, configurable: true })
    sessionStorage.setItem('preview_authorized', 'true')
  })

  it('returns without calling navigateTo when already authorized', () => {
    middleware(makeRoute())
    expect(vi.mocked((globalThis as Record<string, unknown>).navigateTo as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled()
  })

  it('allows access with any token value when already authorized', () => {
    middleware(makeRoute('any-value'))
    expect(vi.mocked((globalThis as Record<string, unknown>).navigateTo as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled()
  })
})

describe('previewAccess middleware – valid token', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'parent', { value: window, writable: true, configurable: true })
    sessionStorage.clear()
  })

  it('marks session as authorized when token is valid', () => {
    const token = generateToken()
    middleware(makeRoute(token))
    expect(sessionStorage.getItem('preview_authorized')).toBe('true')
  })

  it('does not redirect when token is valid', () => {
    const token = generateToken()
    middleware(makeRoute(token))
    expect(vi.mocked((globalThis as Record<string, unknown>).navigateTo as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled()
  })

  it('accepts a freshly generated token', () => {
    const token = generateToken()
    expect(validateToken(token)).toBe(true)
    middleware(makeRoute(token))
    expect(sessionStorage.getItem('preview_authorized')).toBe('true')
  })
})

describe('previewAccess middleware – invalid token', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'parent', { value: window, writable: true, configurable: true })
    sessionStorage.clear()
  })

  it('redirects to / when no token is provided', () => {
    middleware(makeRoute())
    expect(vi.mocked((globalThis as Record<string, unknown>).navigateTo as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('/')
  })

  it('redirects to / when token is an empty string', () => {
    middleware(makeRoute(''))
    expect(vi.mocked((globalThis as Record<string, unknown>).navigateTo as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('/')
  })

  it('redirects to / when token is malformed', () => {
    middleware(makeRoute('not-a-valid-token'))
    expect(vi.mocked((globalThis as Record<string, unknown>).navigateTo as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('/')
  })

  it('does not set session as authorized when token is invalid', () => {
    middleware(makeRoute('bad.token'))
    expect(sessionStorage.getItem('preview_authorized')).not.toBe('true')
  })

  it('redirects to / when token is expired', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)
    const token = generateToken()
    vi.setSystemTime(now + 5 * 60 * 1000 + 1000)
    middleware(makeRoute(token))
    expect(vi.mocked((globalThis as Record<string, unknown>).navigateTo as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('/')
    vi.useRealTimers()
  })

  it('redirects to / when token timestamp is tampered', () => {
    const token = generateToken()
    const [, hash] = token.split('.')
    middleware(makeRoute(`0.${hash}`))
    expect(vi.mocked((globalThis as Record<string, unknown>).navigateTo as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('/')
  })

  it('redirects to / when token hash is tampered', () => {
    const token = generateToken()
    const [ts] = token.split('.')
    middleware(makeRoute(`${ts}.wronghash`))
    expect(vi.mocked((globalThis as Record<string, unknown>).navigateTo as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('/')
  })
})

describe('previewAccess middleware – server side', () => {
  it('validateToken is exported and works for roundtrip', () => {
    const token = generateToken()
    expect(validateToken(token)).toBe(true)
  })

  it('validateToken returns false for garbage input', () => {
    expect(validateToken('garbage')).toBe(false)
  })

  it('generateToken produces different tokens over time', async () => {
    const t1 = generateToken()
    await new Promise(r => setTimeout(r, 2))
    const t2 = generateToken()
    expect(t1).not.toBe(t2)
  })
})
