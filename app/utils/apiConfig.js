export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1338'
export const STRAPI_PROXY = '/api/strapi'

export const getHeaders = () => ({ 'Content-Type': 'application/json' })
export const getHeadersWithAuth = () => ({ 'Content-Type': 'application/json' })
export const getAuthHeader = () => ({})
