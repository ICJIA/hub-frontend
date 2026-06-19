import { defineEventHandler, getHeader, getRequestURL, proxyRequest, createError } from 'h3'
import { createHmac, timingSafeEqual } from 'node:crypto'

// Exact set of (method, path pattern) pairs the app uses — everything else is rejected.
const ALLOWED: [string, RegExp][] = [
  ['GET',  /^articles$/],
  ['GET',  /^articles\/[^/]+$/],
  ['PUT',  /^articles\/[^/]+$/],
  ['GET',  /^datasets$/],
  ['GET',  /^datasets\/[^/]+$/],
  ['PUT',  /^datasets\/[^/]+$/],
  ['GET',  /^apps$/],
  ['GET',  /^apps\/[^/]+$/],
  ['PUT',  /^apps\/[^/]+$/],
  ['POST', /^upload$/],
  ['GET',  /^upload\/files$/],
]

const TOKEN_TTL_MS = 5 * 60 * 1000

function isValidPreviewToken(token: string | undefined, secret: string): boolean {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot === -1) return false
  const tsStr = token.slice(0, dot)
  const mac = token.slice(dot + 1)
  const ts = parseInt(tsStr, 10)
  if (isNaN(ts) || Date.now() - ts > TOKEN_TTL_MS) return false
  const expected = createHmac('sha256', secret).update(tsStr).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(mac, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const method = event.method
  const path = (event.context.params?.path ?? '').replace(/^\//, '')

  // 1. Reject anything outside the allowlist.
  const permitted = ALLOWED.some(([m, re]) => m === method && re.test(path))
  if (!permitted) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // 2. Every request — including reads of draft content — requires a valid
  //    preview token. The server bearer token must never be exercised on behalf
  //    of an unauthenticated caller.
  const token = getHeader(event, 'x-preview-token')
  if (!isValidPreviewToken(token, config.previewSecret)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const qs = getRequestURL(event).search
  const strapiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:1338'
  const target = `${strapiUrl}/api/${path}${qs}`

  return proxyRequest(event, target, {
    headers: { Authorization: `Bearer ${config.apiToken}` }
  })
})
