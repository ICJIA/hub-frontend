const SECRET = process.env.STRAPI_ADMIN_PREVIEW_SECRET || 'preview-secret'
const VALIDITY_MS = 5 * 60 * 1000 // 5 minutes

function hash(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0
  }
  return Math.abs(h).toString(36)
}

export function generateToken(): string {
  const ts = Date.now()
  return `${ts}.${hash(`${ts}:${SECRET}`)}`
}
