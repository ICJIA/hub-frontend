import { generateToken } from '~/utils/previewToken'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1338'
export const STRAPI_PROXY = '/api/strapi'

export const getHeaders = () => ({ 'Content-Type': 'application/json' })

// Generate a fresh short-lived token for each proxy request. Only callable
// after the preview-access middleware has set 'preview_authorized' in sessionStorage.
const getPreviewToken = () => {
  if (typeof window === 'undefined') return ''
  if (sessionStorage.getItem('preview_authorized') !== 'true') return ''
  return generateToken()
}

export const getHeadersWithAuth = () => ({
  'Content-Type': 'application/json',
  'x-preview-token': getPreviewToken()
})

export const getAuthHeader = () => ({
  'x-preview-token': getPreviewToken()
})
