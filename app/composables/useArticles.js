export const useArticles = () => {
  const fetchArticles = async (page = 1, pageSize = 10, sort = 'date:desc', search = '', filters = {}) => {
    const params = new URLSearchParams({
      populate: '*',
      'pagination[page]': page,
      'pagination[pageSize]': pageSize,
      sort
    })
    if (search) {
      params.append('filters[$or][0][title][$containsi]', search)
      params.append('filters[$or][1][abstract][$containsi]', search)
      params.append('filters[$or][2][authors][$containsi]', search)
      params.append('filters[$or][3][categories][$containsi]', search)
      params.append('filters[$or][4][markdown][$containsi]', search)
      params.append('filters[$or][5][citation][$containsi]', search)
      params.append('filters[$or][6][funding][$containsi]', search)
    }
    if (filters.category) params.append('filters[categories][$containsi]', filters.category)
    if (filters.author) params.append('filters[authors][$containsi]', filters.author)
    if (filters.year) {
      params.append('filters[date][$gte]', `${filters.year}-01-01`)
      params.append('filters[date][$lte]', `${filters.year}-12-31`)
    }
    const response = await fetch(`${API_BASE_URL}/api/articles?${params}`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  }

  const fetchArticleById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/articles/${id}?&populate=*`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    if (data.data) return data.data
    throw new Error('Article not found')
  }

  const fetchArticleBySlug = async (slug) => {
    const params = new URLSearchParams({ 'filters[slug][$eq]': slug, populate: '*' })
    const response = await fetch(`${API_BASE_URL}/api/articles?${params}`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    if (data.data?.[0]) return data.data[0]
    throw new Error('Article not found')
  }

  const fetchArticlePreviewById = async (id) => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    const response = await fetch(`${API_BASE_URL}/api/articles/${id}?status=${status}&populate=*`, { headers: getHeadersWithAuth() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.data
  }

  const updateArticle = async (id, articleData, statusOverride) => {
    const params = new URLSearchParams(window.location.search)
    const status = statusOverride || params.get('status')
    const dataToSend = { ...articleData }
    if (dataToSend.Splash && typeof dataToSend.Splash === 'object' && dataToSend.Splash.id) {
      dataToSend.Splash = dataToSend.Splash.id
    }
    const queryParams = new URLSearchParams()
    if (status) queryParams.append('status', status)
    queryParams.append('populate', '*')
    const response = await fetch(`${API_BASE_URL}/api/articles/${id}?${queryParams}`, {
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

  const publishArticle = async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/articles/${id}?status=published&populate=*`, {
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

  const fetchArticlesBasic = async (search = '') => {
    const params = new URLSearchParams({
      status: 'draft',
      'fields[0]': 'id',
      'fields[1]': 'Title',
      'fields[2]': 'documentId',
      'fields[3]': 'slug',
      'pagination[pageSize]': 50
    })
    if (search) params.append('filters[title][$containsi]', search)
    const response = await fetch(`${API_BASE_URL}/api/articles?${params}`, { headers: getHeadersWithAuth() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.data || []
  }

  return {
    fetchArticles,
    fetchArticleById,
    fetchArticleBySlug,
    fetchArticlePreviewById,
    updateArticle,
    publishArticle,
    fetchArticlesBasic
  }
}
