export const useDatasets = () => {
  const fetchDatasets = async (page = 1, pageSize = 10, sort = 'date:desc', search = '', filters = {}) => {
    const params = new URLSearchParams({
      populate: '*',
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      sort
    })
    if (search) {
      params.append('filters[$or][0][title][$containsi]', search)
      params.append('filters[$or][1][description][$containsi]', search)
      params.append('filters[$or][2][categories][$containsi]', search)
    }
    if (filters.category) params.append('filters[categories][$containsi]', filters.category)
    if (filters.year) {
      params.append('filters[date][$gte]', `${filters.year}-01-01`)
      params.append('filters[date][$lte]', `${filters.year}-12-31`)
    }
    const response = await fetch(`${API_BASE_URL}/api/datasets?${params}`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  }

  const fetchDatasetById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/datasets/${id}?populate=*`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    if (data.data) return data.data
    throw new Error('Dataset not found')
  }

  const fetchDatasetBySlug = async (slug) => {
    const params = new URLSearchParams({ 'filters[slug][$eq]': slug, populate: '*' })
    const response = await fetch(`${API_BASE_URL}/api/datasets?${params}`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    if (data.data?.[0]) return data.data[0]
    throw new Error('Dataset not found')
  }

  const fetchDatasetPreviewById = async (id) => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status') || 'draft'
    const queryParams = new URLSearchParams()
    queryParams.set('status', status)
    queryParams.append('populate', '*')
    const response = await fetch(`${STRAPI_PROXY}/datasets/${id}?${queryParams}`, { headers: getHeadersWithAuth() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.data
  }

  const updateDataset = async (id, datasetData, statusOverride) => {
    const params = new URLSearchParams(window.location.search)
    const status = statusOverride || params.get('status')
    const dataToSend = { ...datasetData }
    // Media field: send array of numeric IDs (empty array clears the field).
    if (Array.isArray(dataToSend.datafile)) {
      dataToSend.datafile = dataToSend.datafile
        .map(f => (typeof f === 'number' ? f : f?.id))
        .filter(Boolean)
    } else if (dataToSend.datafile && typeof dataToSend.datafile === 'object' && dataToSend.datafile.id) {
      dataToSend.datafile = [dataToSend.datafile.id]
    } else if (dataToSend.datafile === null) {
      dataToSend.datafile = []
    } else {
      delete dataToSend.datafile
    }
    if (Array.isArray(dataToSend.apps)) {
      dataToSend.apps = dataToSend.apps.map(a => (typeof a === 'number' ? a : a.id)).filter(Boolean)
    }
    if (Array.isArray(dataToSend.articles)) {
      dataToSend.articles = dataToSend.articles.map(a => (typeof a === 'number' ? a : a.id)).filter(Boolean)
    }
    const queryParams = new URLSearchParams()
    if (status) queryParams.append('status', status)
    queryParams.append('populate', '*')
    const response = await fetch(`${STRAPI_PROXY}/datasets/${id}?${queryParams}`, {
      method: 'PUT',
      headers: getHeadersWithAuth(),
      body: JSON.stringify({ data: dataToSend })
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.data
  }

  const publishDataset = async (id) => {
    const queryParams = new URLSearchParams({ status: 'published' })
    const response = await fetch(`${STRAPI_PROXY}/datasets/${id}?${queryParams}`, {
      method: 'PUT',
      headers: getHeadersWithAuth(),
      body: JSON.stringify({ data: {} })
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.data
  }

  const fetchDatasetsBasic = async (search = '') => {
    const params = new URLSearchParams({
      status: 'draft',
      'fields[0]': 'id',
      'fields[1]': 'title',
      'fields[2]': 'documentId',
      'fields[3]': 'slug',
      'pagination[pageSize]': 50
    })
    if (search) params.append('filters[title][$containsi]', search)
    const response = await fetch(`${STRAPI_PROXY}/datasets?${params}`, { headers: getHeadersWithAuth() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.data || []
  }

  return {
    fetchDatasets,
    fetchDatasetById,
    fetchDatasetBySlug,
    fetchDatasetPreviewById,
    updateDataset,
    publishDataset,
    fetchDatasetsBasic
  }
}
