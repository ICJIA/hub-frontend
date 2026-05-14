import { describe, it, expect, beforeEach, vi } from 'vitest'

// Import after setup so globals are available
import {
  API_BASE_URL,
  STRAPI_PROXY,
  getHeaders,
  getHeadersWithAuth,
  getAuthHeader,
} from '../../../app/utils/apiConfig.js'

describe('API_BASE_URL', () => {
  it('is a non-empty string', () => {
    expect(typeof API_BASE_URL).toBe('string')
    expect(API_BASE_URL.length).toBeGreaterThan(0)
  })

  it('defaults to localhost when VITE_API_BASE_URL is not set', () => {
    expect(API_BASE_URL).toBe('http://localhost:1338')
  })

  it('is a valid URL-like string starting with http', () => {
    expect(API_BASE_URL).toMatch(/^https?:\/\//)
  })
})

describe('STRAPI_PROXY', () => {
  it('equals /api/strapi', () => {
    expect(STRAPI_PROXY).toBe('/api/strapi')
  })

  it('starts with a forward slash', () => {
    expect(STRAPI_PROXY.startsWith('/')).toBe(true)
  })
})

describe('getHeaders', () => {
  it('returns an object', () => {
    expect(typeof getHeaders()).toBe('object')
  })

  it('contains Content-Type header', () => {
    expect(getHeaders()).toHaveProperty('Content-Type')
  })

  it('Content-Type is application/json', () => {
    expect(getHeaders()['Content-Type']).toBe('application/json')
  })

  it('returns a new object on each call', () => {
    const a = getHeaders()
    const b = getHeaders()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})

describe('getHeadersWithAuth', () => {
  it('returns an object', () => {
    expect(typeof getHeadersWithAuth()).toBe('object')
  })

  it('contains Content-Type header', () => {
    expect(getHeadersWithAuth()).toHaveProperty('Content-Type')
  })

  it('Content-Type is application/json', () => {
    expect(getHeadersWithAuth()['Content-Type']).toBe('application/json')
  })

  it('contains x-preview-token header', () => {
    expect(getHeadersWithAuth()).toHaveProperty('x-preview-token')
  })

  it('x-preview-token is empty string when not authorized', () => {
    // sessionStorage is empty → not authorized → token is ''
    expect(getHeadersWithAuth()['x-preview-token']).toBe('')
  })
})

describe('getAuthHeader', () => {
  it('returns an object', () => {
    expect(typeof getAuthHeader()).toBe('object')
  })

  it('contains x-preview-token key', () => {
    expect(getAuthHeader()).toHaveProperty('x-preview-token')
  })

  it('x-preview-token is empty string when not authorized', () => {
    expect(getAuthHeader()['x-preview-token']).toBe('')
  })
})
