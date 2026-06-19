import { createHmac, timingSafeEqual } from 'node:crypto'
import { readBody, setCookie } from 'h3'

const URL_TOKEN_TTL_MS = 5 * 60 * 1000
const SESSION_TTL_MS = 60 * 60 * 1000

function verifyHmacToken(token: string, secret: string, ttlMs: number, prefix = ''): boolean {
  const dot = token.indexOf('.')
  if (dot === -1) return false
  const tsStr = token.slice(0, dot)
  const mac = token.slice(dot + 1)
  const ts = parseInt(tsStr, 10)
  if (isNaN(ts) || Date.now() - ts > ttlMs) return false
  const expected = createHmac('sha256', secret).update(`${prefix}${tsStr}`).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(mac, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)
  const token = typeof body?.token === 'string' ? body.token : ''

  if (!token || !verifyHmacToken(token, config.previewSecret, URL_TOKEN_TTL_MS)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const ts = Date.now()
  const sessionMac = createHmac('sha256', config.previewSecret)
    .update(`session:${ts}`)
    .digest('hex')

  setCookie(event, 'preview_session', `${ts}.${sessionMac}`, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })

  return { ok: true }
})
