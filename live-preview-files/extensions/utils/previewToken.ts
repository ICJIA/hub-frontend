const SECRET = process.env.STRAPI_ADMIN_PREVIEW_SECRET || ''

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function generateToken(): Promise<string> {
  const ts = Date.now()
  const mac = await hmacSha256(SECRET, String(ts))
  return `${ts}.${mac}`
}
