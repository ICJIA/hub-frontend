export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1338'
const bearerToken = import.meta.env.VITE_API_BEARER_TOKEN || ''

const getHeaders = () => ({
  'Content-Type': 'application/json'
})

const getHeadersWithAuth = () => ({
  'Content-Type': 'application/json',
  ...(bearerToken && { 'Authorization': `Bearer ${bearerToken}` })
})

export const fetchArticles = async (page = 1, pageSize = 10, sort = 'Date:desc', search = '', filters = {}) => {
  const params = new URLSearchParams({
    'populate': '*',
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'sort': sort
  });
  if (search) {
    params.append('filters[$or][0][Title][$containsi]', search)
    params.append('filters[$or][1][Abstract][$containsi]', search)
    params.append('filters[$or][2][Authors][$containsi]', search)
    params.append('filters[$or][3][Categories][$containsi]', search)
    params.append('filters[$or][4][Markdown][$containsi]', search)
    params.append('filters[$or][5][Citation][$containsi]', search)
    params.append('filters[$or][6][Funding][$containsi]', search)
  }
  if (filters.category) {
    params.append('filters[Categories][$containsi]', filters.category)
  }
  if (filters.author) {
    params.append('filters[Authors][$containsi]', filters.author)
  }
  if (filters.year) {
    params.append('filters[Date][$gte]', `${filters.year}-01-01`)
    params.append('filters[Date][$lte]', `${filters.year}-12-31`)
  }

  const response = await fetch(
    `${API_BASE_URL}/api/articles?${params}`,
    {
      headers: getHeaders()
    }
  )
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return response.json()
}

export const fetchArticleById = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/api/articles/${id}?&populate=*`,
    {
      headers: getHeaders()
    }
  )
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  if(data.data) {
    return data.data;
  } 
  
  throw new Error('Article not found')
}

export const fetchArticlePreviewById = async (id) => {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');
  
  const response = await fetch(
    `${API_BASE_URL}/api/articles/${id}?status=${status}&populate=*`,
    {
      headers: getHeadersWithAuth()
    }
  )
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()

  return data.data;
}

export const updateArticle = async (id, articleData, statusOverride) => {
  // Use explicit status override, fall back to querystring
  const params = new URLSearchParams(window.location.search)
  const status = statusOverride || params.get('status')

  // Handle Splash - if it's a media object, only send the ID
  const dataToSend = { ...articleData }
  if (dataToSend.Splash && typeof dataToSend.Splash === 'object' && dataToSend.Splash.id) {
    dataToSend.Splash = dataToSend.Splash.id
  }
  const queryParams = new URLSearchParams()
if (status) {
  queryParams.append('status', status)
}
queryParams.append('populate', '*')

const response = await fetch(
  `${API_BASE_URL}/api/articles/${id}?${queryParams.toString()}`,
    {
      method: 'PUT',
      headers: getHeadersWithAuth(),
      body: JSON.stringify({ data: dataToSend })
    }
  )
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
  }
  
  const data = await response.json()
  return data.data
}

export const publishArticle = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/api/articles/${id}?status=published&populate=*`,
    {
      method: 'PUT',
      headers: getHeadersWithAuth(),
      body: JSON.stringify({ data: {} })
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.data
}

export const uploadMedia = async (file) => {
  const formData = new FormData()
  formData.append('files', file)

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      ...(bearerToken && { 'Authorization': `Bearer ${bearerToken}` })
      // Note: Don't include Content-Type - browser sets it with boundary for FormData
    },
    body: formData
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`)
  }

  const uploadedFiles = await response.json()
  return uploadedFiles[0] // Returns first uploaded file with full media object
}

// type: 'image' → only images | 'file' → non-images | 'all' → no mime filter
export const fetchMediaFiles = async (page = 1, pageSize = 20, search = '', type = 'image') => {
  const params = new URLSearchParams({
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'sort': 'createdAt:desc'
  })
  if (type === 'image') {
    params.append('filters[mime][$contains]', 'image')
  } else if (type === 'file') {
    params.append('filters[mime][$notContains]', 'image')
  }
  if (search) {
    params.append('filters[name][$contains]', search)
  }

  const response = await fetch(`${API_BASE_URL}/api/upload/files?${params}`, {
    headers: {
      ...(bearerToken && { 'Authorization': `Bearer ${bearerToken}` })
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch media: ${response.status}`)
  }

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

export const fetchDatasetPreviewById = async (id) => {
  const params = new URLSearchParams(window.location.search)
  const status = params.get('status') || 'draft'

  const queryParams = new URLSearchParams()
  queryParams.set('status', status)
  //queryParams.append('populate[apps][fields][0]', 'id')
  //queryParams.append('populate[apps][fields][1]', 'title')
  //queryParams.append('populate[apps][fields][2]', 'documentId')
  //queryParams.append('populate[articles][fields][0]', 'id')
  //queryParams.append('populate[articles][fields][1]', 'Title')
  //queryParams.append('populate[articles][fields][2]', 'documentId')
  queryParams.append('populate', '*')

  const response = await fetch(
    `${API_BASE_URL}/api/datasets/${id}?${queryParams}`,
    { headers: getHeadersWithAuth() }
  )

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  const data = await response.json()
  return data.data
}

export const updateDataset = async (id, datasetData, statusOverride) => {
  const params = new URLSearchParams(window.location.search)
  const status = statusOverride || params.get('status')

  const dataToSend = { ...datasetData }

  // Media field: send array of numeric IDs (empty array clears the field).
  // Never send null or full media objects — Strapi 5 rejects 'related' (polymorphic backref).
  dataToSend.Datafile = Array.isArray(dataToSend.Datafile)
    ? dataToSend.Datafile.map(f => (typeof f === 'number' ? f : f?.id)).filter(Boolean)
    : []
  if (Array.isArray(dataToSend.apps)) {
    dataToSend.apps = dataToSend.apps.map(a => (typeof a === 'number' ? a : a.id)).filter(Boolean)
  }
  if (Array.isArray(dataToSend.articles)) {
    dataToSend.articles = dataToSend.articles.map(a => (typeof a === 'number' ? a : a.id)).filter(Boolean)
  }

  const queryParams = new URLSearchParams()
  if (status) queryParams.append('status', status)
 
  queryParams.append('populate', '*')
  // populate[Datafile]=* omitted: Strapi 5 validates the populated media response (which
  // includes the internal 'related' polymorphic backref) and throws a ValidationError
  // even when Datafile is absent from the request body.

  const response = await fetch(
    `${API_BASE_URL}/api/datasets/${id}?${queryParams}`,
    {
      method: 'PUT',
      headers: getHeadersWithAuth(),
      body: JSON.stringify({ data: dataToSend })
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.data
}

export const publishDataset = async (id) => {
  const queryParams = new URLSearchParams({
    'status': 'published',
  })
  // populate[Datafile]=* omitted — same Strapi 5 validation bug as in updateDataset.

  const response = await fetch(
    `${API_BASE_URL}/api/datasets/${id}?${queryParams}`,
    {
      method: 'PUT',
      headers: getHeadersWithAuth(),
      body: JSON.stringify({ data: {} })
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.data
}

export const fetchAppPreviewById = async (id) => {
  const params = new URLSearchParams(window.location.search)
  const status = params.get('status') || 'draft'

  const queryParams = new URLSearchParams()
  queryParams.set('status', status)
  queryParams.append('populate', '*')

  const response = await fetch(
    `${API_BASE_URL}/api/apps/${id}?${queryParams}`,
    { headers: getHeadersWithAuth() }
  )

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  const data = await response.json()
  return data.data
}

export const updateApp = async (id, appData, statusOverride) => {
  const params = new URLSearchParams(window.location.search)
  const status = statusOverride || params.get('status')

  const dataToSend = { ...appData }

  // Image field: Strapi returns it as an array, so send back as array of IDs
  if (dataToSend.image && typeof dataToSend.image === 'object' && dataToSend.image.id) {
    dataToSend.image = [dataToSend.image.id]
  } else if (!dataToSend.image) {
    dataToSend.image = []
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

  const response = await fetch(
    `${API_BASE_URL}/api/apps/${id}?${queryParams}`,
    {
      method: 'PUT',
      headers: getHeadersWithAuth(),
      body: JSON.stringify({ data: dataToSend })
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.data
}

export const publishApp = async (id) => {
  const response = await fetch(
    `${API_BASE_URL}/api/apps/${id}?status=published&populate=*`,
    {
      method: 'PUT',
      headers: getHeadersWithAuth(),
      body: JSON.stringify({ data: {} })
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
  }

  const data = await response.json()
  return data.data
}

export const fetchApps = async (page = 1, pageSize = 10, sort = 'Date:desc', search = '', filters = {}) => {
  const params = new URLSearchParams({
    'populate': '*',
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'sort': sort
  })
  if (search) {
    params.append('filters[$or][0][Title][$containsi]', search)
    params.append('filters[$or][1][description][$containsi]', search)
    params.append('filters[$or][2][contributors][$containsi]', search)
    params.append('filters[$or][3][categories][$containsi]', search)
  }
  if (filters.category) {
    params.append('filters[categories][$containsi]', filters.category)
  }
  if (filters.author) {
    params.append('filters[contributors][$containsi]', filters.author)
  }
  if (filters.year) {
    params.append('filters[Date][$gte]', `${filters.year}-01-01`)
    params.append('filters[Date][$lte]', `${filters.year}-12-31`)
  }
  const response = await fetch(`${API_BASE_URL}/api/apps?${params}`, { headers: getHeaders() })
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return response.json()
}

export const fetchAppById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/apps/${id}?populate=*`, { headers: getHeaders() })
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  const data = await response.json()
  if (data.data) return data.data
  throw new Error('App not found')
}

export const fetchDatasets = async (page = 1, pageSize = 10, sort = 'date:desc', search = '', filters = {}) => {
  const params = new URLSearchParams({
    'populate': '*',
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'sort': sort
  })
  if (search) {
    params.append('filters[$or][0][title][$containsi]', search)
    params.append('filters[$or][1][Description][$containsi]', search)
    params.append('filters[$or][2][categories][$containsi]', search)
  }
  if (filters.category) {
    params.append('filters[categories][$containsi]', filters.category)
  }
  if (filters.year) {
    params.append('filters[date][$gte]', `${filters.year}-01-01`)
    params.append('filters[date][$lte]', `${filters.year}-12-31`)
  }
  const response = await fetch(`${API_BASE_URL}/api/datasets?${params}`, { headers: getHeaders() })
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  return response.json()
}

export const fetchDatasetById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/datasets/${id}?populate=*`, { headers: getHeaders() })
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  const data = await response.json()
  if (data.data) return data.data
  throw new Error('Dataset not found')
}

export const fetchDatasetsBasic = async (search = '') => {
  const params = new URLSearchParams({
    'status': 'draft',
    'fields[0]': 'id',
    'fields[1]': 'title',
    'fields[2]': 'documentId',
    'pagination[pageSize]': 50,
  })
  if (search) params.append('filters[title][$containsi]', search)

  const response = await fetch(`${API_BASE_URL}/api/datasets?${params}`, {
    headers: getHeadersWithAuth()
  })
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  const data = await response.json()
  return data.data || []
}

export const fetchAppsBasic = async (search = '') => {
  const params = new URLSearchParams({ 'status': 'draft' })
  if (search) params.append('filters[Title][$containsi]', search)

  const response = await fetch(`${API_BASE_URL}/api/apps?${params}`, {
    headers: getHeadersWithAuth()
  })
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  const data = await response.json()
  return data.data || []
}

export const fetchArticlesBasic = async (search = '') => {
  const params = new URLSearchParams({
    'status': 'draft',
    'fields[0]': 'id',
    'fields[1]': 'Title',
    'fields[2]': 'documentId',
    'pagination[pageSize]': 50,
  })
  if (search) params.append('filters[Title][$containsi]', search)

  const response = await fetch(`${API_BASE_URL}/api/articles?${params}`, {
    headers: getHeadersWithAuth()
  })
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  const data = await response.json()
  return data.data || []
}

export default {
  fetchArticles,
  fetchArticleById,
  fetchApps,
  fetchAppById,
  fetchDatasets,
  fetchDatasetById,
  fetchArticlePreviewById,
  updateArticle,
  publishArticle,
  uploadMedia,
  fetchMediaFiles,
  fetchDatasetPreviewById,
  updateDataset,
  publishDataset,
  fetchAppPreviewById,
  updateApp,
  publishApp,
  fetchDatasetsBasic,
  fetchAppsBasic,
  fetchArticlesBasic,
}