import { generateToken } from '~/utils/previewToken'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1338'
export const STRAPI_PROXY = '/api/strapi'

export const getHeaders = () => ({ 'Content-Type': 'application/json' })

const getPreviewToken = async () => {
  if (typeof window === 'undefined') return ''
  if (sessionStorage.getItem('preview_authorized') !== 'true') return ''
  return generateToken()
}

export const getHeadersWithAuth = async () => ({
  'Content-Type': 'application/json',
  'x-preview-token': await getPreviewToken()
})

export const getAuthHeader = async () => ({
  'x-preview-token': await getPreviewToken()
})
