export const useMedia = () => {
  const uploadMedia = async (file) => {
    const formData = new FormData()
    formData.append('files', file)
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        ...getAuthHeader()
        // Note: Don't include Content-Type - browser sets it with boundary for FormData
      },
      body: formData
    })
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`)
    const uploadedFiles = await response.json()
    return uploadedFiles[0]
  }

  // type: 'image' → only images | 'file' → non-images | 'all' → no mime filter
  const fetchMediaFiles = async (page = 1, pageSize = 20, search = '', type = 'image') => {
    const params = new URLSearchParams({
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      sort: 'createdAt:desc'
    })
    if (type === 'image') {
      params.append('filters[mime][$contains]', 'image')
    } else if (type === 'file') {
      params.append('filters[mime][$notContains]', 'image')
    }
    if (search) params.append('filters[name][$contains]', search)
    const response = await fetch(`${API_BASE_URL}/api/upload/files?${params}`, {
      headers: getAuthHeader()
    })
    if (!response.ok) throw new Error(`Failed to fetch media: ${response.status}`)
    const data = await response.json()
    // Strapi upload /api/upload/files returns an array directly (no data wrapper)
    if (Array.isArray(data)) {
      return { files: data, total: data.length, hasMore: false }
    }
    const files = data.results ?? data
    const total = data.pagination?.total ?? files.length
    const pageCount = data.pagination?.pageCount ?? 1
    return { files, total, hasMore: page < pageCount }
  }

  return {
    uploadMedia,
    fetchMediaFiles
  }
}
