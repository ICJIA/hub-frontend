import { validateToken } from '~/utils/previewToken'

const SESSION_KEY = 'preview_authorized'

export default defineNuxtRouteMiddleware((to) => {
  // sessionStorage and window are only available in the browser
  if (import.meta.server) return

  // Opened inside an iframe (e.g. Strapi admin modal) — allow, but still mark
  // the session so proxy calls can mint a preview token.
  if (window.parent !== window) {
    sessionStorage.setItem(SESSION_KEY, 'true')
    return
  }

  // Same tab — check if already authorised this session
  if (sessionStorage.getItem(SESSION_KEY) === 'true') return

  // Opened via window.open from preview — validate the signed token
  if (validateToken(to.query.token as string)) {
    sessionStorage.setItem(SESSION_KEY, 'true')
    return
  }

  return navigateTo('/')
})
