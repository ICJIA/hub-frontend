import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateToken, validateToken } from '../../../app/utils/previewToken.js'

describe('generateToken', () => {
  it('returns a string', () => {
    expect(typeof generateToken()).toBe('string')
  })

  it('contains a single dot separator', () => {
    const token = generateToken()
    const parts = token.split('.')
    expect(parts).toHaveLength(2)
  })

  it('first part is a valid numeric timestamp', () => {
    const token = generateToken()
    const [tsStr] = token.split('.')
    const ts = parseInt(tsStr, 10)
    expect(Number.isNaN(ts)).toBe(false)
    expect(ts).toBeGreaterThan(0)
  })

  it('timestamp portion is close to current time', () => {
    const before = Date.now()
    const token = generateToken()
    const after = Date.now()
    const ts = parseInt(token.split('.')[0], 10)
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })

  it('hash portion is a non-empty string', () => {
    const token = generateToken()
    const [, hash] = token.split('.')
    expect(hash).toBeTruthy()
    expect(hash.length).toBeGreaterThan(0)
  })

  it('hash portion contains only base-36 characters', () => {
    const token = generateToken()
    const [, hash] = token.split('.')
    expect(hash).toMatch(/^[0-9a-z]+$/)
  })

  it('two tokens generated at different ms have different timestamps', async () => {
    const t1 = generateToken()
    await new Promise(r => setTimeout(r, 2))
    const t2 = generateToken()
    const ts1 = parseInt(t1.split('.')[0], 10)
    const ts2 = parseInt(t2.split('.')[0], 10)
    expect(ts2).toBeGreaterThanOrEqual(ts1)
  })

  it('token format is timestamp.hash', () => {
    const token = generateToken()
    expect(token).toMatch(/^\d+\.[0-9a-z]+$/)
  })
})

describe('validateToken', () => {
  it('returns false for null', () => {
    expect(validateToken(null as unknown as string)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(validateToken(undefined as unknown as string)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(validateToken('')).toBe(false)
  })

  it('returns false for a token with no dot separator', () => {
    expect(validateToken('invalidtoken')).toBe(false)
  })

  it('returns false for a non-numeric timestamp', () => {
    expect(validateToken('abc.hashvalue')).toBe(false)
  })

  it('returns true for a freshly generated token', () => {
    const token = generateToken()
    expect(validateToken(token)).toBe(true)
  })

  it('returns false for a tampered hash', () => {
    const token = generateToken()
    const [ts] = token.split('.')
    expect(validateToken(`${ts}.wronghash`)).toBe(false)
  })

  it('returns false for a tampered timestamp', () => {
    const token = generateToken()
    const [, hash] = token.split('.')
    expect(validateToken(`9999999999999.${hash}`)).toBe(false)
  })

  it('returns false for a token older than 5 minutes', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000 - 1
    const token = `${fiveMinutesAgo}.somehash`
    expect(validateToken(token)).toBe(false)
  })

  it('returns false for a token exactly at the 5-minute expiry boundary', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)
    const token = generateToken()
    vi.setSystemTime(now + 5 * 60 * 1000 + 1)
    expect(validateToken(token)).toBe(false)
    vi.useRealTimers()
  })

  it('returns true for a token just under 5 minutes old', () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)
    const token = generateToken()
    vi.setSystemTime(now + 5 * 60 * 1000 - 100)
    expect(validateToken(token)).toBe(true)
    vi.useRealTimers()
  })

  it('returns false for a zero timestamp', () => {
    expect(validateToken('0.somehash')).toBe(false)
  })

  it('extra dot segments are ignored; only the first two parts are validated', () => {
    // split('.') destructuring takes only [ts, hash], so trailing segments have no effect.
    const token = generateToken()
    const withExtra = `${token}.extra`
    // The core ts+hash are still valid, so this returns true (documented behaviour).
    expect(validateToken(withExtra)).toBe(true)
  })

  it('validate roundtrip: generate then validate returns true', () => {
    for (let i = 0; i < 5; i++) {
      const token = generateToken()
      expect(validateToken(token)).toBe(true)
    }
  })
})
