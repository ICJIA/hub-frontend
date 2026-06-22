export const useApps = () => {
  const fetchApps = async (page = 1, pageSize = 10, sort = 'date:desc', search = '', filters = {}) => {
    const params = new URLSearchParams({
      populate: '*',
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      sort
    })
    if (search) {
      params.append('filters[$or][0][title][$containsi]', search)
      params.append('filters[$or][1][description][$containsi]', search)
      params.append('filters[$or][2][contributors][$containsi]', search)
      params.append('filters[$or][3][categories][$containsi]', search)
    }
    if (filters.category) params.append('filters[categories][$containsi]', filters.category)
    if (filters.author) params.append('filters[contributors][$containsi]', filters.author)
    if (filters.year) {
      params.append('filters[date][$gte]', `${filters.year}-01-01`)
      params.append('filters[date][$lte]', `${filters.year}-12-31`)
    }
    const response = await fetch(`${API_BASE_URL}/api/apps?${params}`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  }

  const fetchAppById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/apps/${id}?populate=*`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    if (data.data) return data.data
    throw new Error('App not found')
  }

  const fetchAppBySlug = async (slug) => {
    const params = new URLSearchParams({ 'filters[slug][$eq]': slug, populate: '*' })
    const response = await fetch(`${API_BASE_URL}/api/apps?${params}`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    if (data.data?.[0]) return data.data[0]
    throw new Error('App not found')
  }

  const fetchAppPreviewById = async (id) => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status') || 'draft'
    const queryParams = new URLSearchParams()
    queryParams.set('status', status)
    queryParams.append('populate', '*')
    const response = await fetch(`${STRAPI_PROXY}/apps/${id}?${queryParams}`, { headers: await getHeadersWithAuth() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.data
  }

  const updateApp = async (id, appData, statusOverride) => {
    const params = new URLSearchParams(window.location.search)
    const status = statusOverride || params.get('status')
    const dataToSend = { ...appData }
    if (typeof dataToSend.image === 'number') {
      dataToSend.image = [dataToSend.image]
    } else if (dataToSend.image && typeof dataToSend.image === 'object' && dataToSend.image.id) {
      dataToSend.image = [dataToSend.image.id]
    } else if (dataToSend.image === null) {
      dataToSend.image = []
    } else if (dataToSend.image === undefined) {
      delete dataToSend.image
    }
    if (Array.isArray(dataToSend.articles)) {
      dataToSend.articles = dataToSend.articles.map(a => (typeof a === 'number' ? a : a.id)).filter(Boolean)
    }
    if (Array.isArray(dataToSend.datasets)) {
      dataToSend.datasets = dataToSend.datasets.map(d => (typeof d === 'number' ? d : d.id)).filter(Boolean)
    }
    const queryParams = new URLSearchParams()
    if (status) queryParams.append('status', status)
    queryParams.append('populate', '*')
    const response = await fetch(`${STRAPI_PROXY}/apps/${id}?${queryParams}`, {
      method: 'PUT',
      headers: await getHeadersWithAuth(),
      body: JSON.stringify({ data: dataToSend })
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.data
  }

  const publishApp = async (id) => {
    const response = await fetch(`${STRAPI_PROXY}/apps/${id}?status=published&populate=*`, {
      method: 'PUT',
      headers: await getHeadersWithAuth(),
      body: JSON.stringify({ data: {} })
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.data
  }

  const fetchAppsBasic = async (search = '') => {
    const params = new URLSearchParams({ status: 'draft' })
    if (search) params.append('filters[title][$containsi]', search)
    const response = await fetch(`${STRAPI_PROXY}/apps?${params}`, { headers: await getHeadersWithAuth() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.data || []
  }

  const getAppImageUrl = (app) => {
    const img = Array.isArray(app?.image) ? app.image[0] : app?.image
    if (!img?.url) return null
    return img.url.startsWith('/') ? `${API_BASE_URL}${img.url}` : img.url
  }

  return {
    fetchApps,
    fetchAppById,
    fetchAppBySlug,
    fetchAppPreviewById,
    updateApp,
    publishApp,
    fetchAppsBasic,
    getAppImageUrl
  }
}
