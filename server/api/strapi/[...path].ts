import { defineEventHandler, getQuery, proxyRequest } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const path = (event.context.params?.path ?? '').replace(/^\//, '')
  const query = getQuery(event)
  const qs = new URLSearchParams(query as Record<string, string>).toString()
  const target = `${config.strapiUrl}/api/${path}${qs ? '?' + qs : ''}`

  return proxyRequest(event, target, {
    headers: { Authorization: `Bearer ${config.apiToken}` }
  })
})
