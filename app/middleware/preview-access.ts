const SESSION_KEY = 'preview_authorized'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  if (sessionStorage.getItem(SESSION_KEY) === 'true') return

  const token = to.query.token as string
  if (token) {
    try {
      await $fetch('/api/preview-authorize', { method: 'POST', body: { token } })
      sessionStorage.setItem(SESSION_KEY, 'true')
      return
    } catch {
      // fall through to redirect
    }
  }

  return navigateTo('/')
})
