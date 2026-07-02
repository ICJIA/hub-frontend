// Netlify Function V2 — Strapi preview API proxy.
// Routes: /api/strapi/* (configured via [[redirects]] in netlify.toml)
//
// Required env vars (set in Netlify UI):
//   VITE_API_BASE_URL   — public Strapi URL
//   NUXT_API_TOKEN      — Strapi bearer token (same value as API_BEARER_TOKEN)
//   NUXT_PREVIEW_SECRET — preview HMAC secret (same value used by client)

const ALLOWED = [
  ['GET',  /^articles$/],
  ['GET',  /^articles\/[^/]+$/],
  ['PUT',  /^articles\/[^/]+$/],
  ['GET',  /^datasets$/],
  ['GET',  /^datasets\/[^/]+$/],
  ['PUT',  /^datasets\/[^/]+$/],
  ['GET',  /^apps$/],
  ['GET',  /^apps\/[^/]+$/],
  ['PUT',  /^apps\/[^/]+$/],
  ['GET',  /^projects$/],
  ['GET',  /^projects\/[^/]+$/],
  ['PUT',  /^projects\/[^/]+$/],
  ['POST', /^upload$/],
  ['GET',  /^upload\/files$/],
]

const TOKEN_TTL_MS = 5 * 60 * 1000

function djb2(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

function isValidPreviewToken(token, secret) {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot === -1) return false
  const ts = parseInt(token.slice(0, dot), 10)
  if (isNaN(ts) || Date.now() - ts > TOKEN_TTL_MS) return false
  return token.slice(dot + 1) === djb2(`${ts}:${secret}`)
}

export default async (request) => {
  const url = new URL(request.url)
  const method = request.method
  const path = url.pathname.replace(/^\/api\/strapi\//, '').replace(/^\//, '')

  const permitted = ALLOWED.some(([m, re]) => m === method && re.test(path))
  if (!permitted) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const previewSecret = process.env.NUXT_PREVIEW_SECRET || 'preview-secret'
  const token = request.headers.get('x-preview-token')
  if (!isValidPreviewToken(token, previewSecret)) {
    let reason = 'no-token'
    if (token) {
      const dot = token.indexOf('.')
      if (dot === -1) reason = 'bad-format'
      else {
        const ts = parseInt(token.slice(0, dot), 10)
        if (isNaN(ts)) reason = 'bad-timestamp'
        else if (Date.now() - ts > TOKEN_TTL_MS) reason = 'expired'
        else reason = 'hash-mismatch'
      }
    }
    return new Response(JSON.stringify({ error: 'Unauthorized', reason }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const strapiUrl = process.env.VITE_API_BASE_URL || 'http://localhost:1338'
  const apiToken = process.env.NUXT_API_TOKEN || process.env.API_BEARER_TOKEN || ''
  const target = `${strapiUrl}/api/${path}${url.search}`

  const proxyHeaders = new Headers()
  proxyHeaders.set('Authorization', `Bearer ${apiToken}`)
  const contentType = request.headers.get('content-type')
  if (contentType) proxyHeaders.set('Content-Type', contentType)

  const isBodyRequest = method !== 'GET' && method !== 'HEAD'
  const strapiResponse = await fetch(target, {
    method,
    headers: proxyHeaders,
    ...(isBodyRequest ? { body: request.body, duplex: 'half' } : {})
  })

  const responseHeaders = new Headers()
  const ct = strapiResponse.headers.get('content-type')
  if (ct) responseHeaders.set('Content-Type', ct)

  return new Response(strapiResponse.body, {
    status: strapiResponse.status,
    headers: responseHeaders
  })
}
