import { defineEventHandler, getHeader, getRequestURL, proxyRequest, createError } from 'h3'

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

function djb2(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

function isValidPreviewToken(token: string | undefined, secret: string): boolean {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot === -1) return false
  const tsStr = token.slice(0, dot)
  const h = token.slice(dot + 1)
  const ts = parseInt(tsStr, 10)
  if (isNaN(ts) || Date.now() - ts > TOKEN_TTL_MS) return false
  return h === djb2(`${ts}:${secret}`)
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
  const target = `${config.strapiUrl}/api/${path}${qs}`

  return proxyRequest(event, target, {
    headers: { Authorization: `Bearer ${config.apiToken}` }
  })
})
