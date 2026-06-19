import { createHmac, timingSafeEqual } from 'node:crypto'
import { getCookie } from 'h3'

const SESSION_TTL_MS = 60 * 60 * 1000
const PROXY_TOKEN_TTL_MS = 5 * 60 * 1000

function verifySessionCookie(value: string, secret: string): boolean {
  const dot = value.indexOf('.')
  if (dot === -1) return false
  const tsStr = value.slice(0, dot)
  const mac = value.slice(dot + 1)
  const ts = parseInt(tsStr, 10)
  if (isNaN(ts) || Date.now() - ts > SESSION_TTL_MS) return false
  const expected = createHmac('sha256', secret).update(`session:${tsStr}`).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(mac, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const sessionCookie = getCookie(event, 'preview_session') ?? ''

  if (!verifySessionCookie(sessionCookie, config.previewSecret)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const ts = Date.now()
  const mac = createHmac('sha256', config.previewSecret).update(String(ts)).digest('hex')
  return { token: `${ts}.${mac}` }
})
