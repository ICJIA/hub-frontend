const SECRET = import.meta.env.VITE_PREVIEW_SECRET || 'preview-secret'
const VALIDITY_MS = 5 * 60 * 1000 // 5 minutes

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h).toString(36)
}

export function generateToken() {
  const ts = Date.now()
  return `${ts}.${hash(`${ts}:${SECRET}`)}`
}

export function validateToken(token) {
  if (!token) return false
  const [tsStr, h] = token.split('.')
  const ts = parseInt(tsStr, 10)
  if (isNaN(ts)) return false
  if (Date.now() - ts > VALIDITY_MS) return false
  return h === hash(`${ts}:${SECRET}`)
}
