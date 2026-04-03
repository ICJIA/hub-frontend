export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1338'

const bearerToken = import.meta.env.VITE_API_BEARER_TOKEN || ''

export const getHeaders = () => ({ 'Content-Type': 'application/json' })

export const getHeadersWithAuth = () => ({
  'Content-Type': 'application/json',
  ...(bearerToken && { Authorization: `Bearer ${bearerToken}` })
})

export const getAuthHeader = () => ({
  ...(bearerToken && { Authorization: `Bearer ${bearerToken}` })
})
