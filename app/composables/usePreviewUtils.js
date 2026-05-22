export const usePreviewUtils = () => {
  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const fixAssetUrls = (html) =>
    html ? html.replace(/(src=["'])(\/[^"']*["'])/g, `$1${API_BASE_URL}$2`) : html

  const resolveImageUrl = (img) => {
    if (!img) return null
    if (typeof img === 'string') return img
    if (img.url) return img.url.startsWith('/') ? `${API_BASE_URL}${img.url}` : img.url
    return null
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return { formatDate, fixAssetUrls, resolveImageUrl, formatFileSize }
}
