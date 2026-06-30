export const useProjects = () => {
  const fetchProjects = async () => {
    const params = new URLSearchParams({
      sort: 'Title:asc',
      'pagination[pageSize]': '100'
    })
    const response = await fetch(`${API_BASE_URL}/api/projects?${params}`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.data || []
  }

  const fetchProjectBySlug = async (slug) => {
    const params = new URLSearchParams({ 'filters[slug][$eq]': slug, populate: '*' })
    const response = await fetch(`${API_BASE_URL}/api/projects?${params}`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    if (data.data?.[0]) return data.data[0]
    throw new Error('Project not found')
  }

  const fetchProjectsForCarousel = async () => {
    const params = new URLSearchParams({
      sort: 'order:asc',
      'pagination[pageSize]': '100',
      'fields[0]': 'Title',
      'fields[1]': 'category',
      'fields[2]': 'description',
      'fields[3]': 'icon',
      'fields[4]': 'headerBg',
      'fields[5]': 'bullets',
      'fields[6]': 'slug',
      'fields[7]': 'order',
    })
    const response = await fetch(`${API_BASE_URL}/api/projects?${params}`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return (data.data || []).map(p => ({
        title: p.Title,
        category: p.category,
        description: p.description,
        icon: p.icon,
        headerBg: p.headerBg,
        bullets: p.bullets || [],
        url: `/projects/${p.slug}`,
      }))
  }

  const fetchProjectHome = async () => {
    const response = await fetch(`${API_BASE_URL}/api/projecthomes?pagination[pageSize]=1`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    const record = data.data?.[0]
    if (!record) throw new Error('Project home not found')
    return {
      heroTitle: record.Herotitle ?? '',
      heroSubtitle: record.Herosubtitle ?? '',
      projectsTitle: record.Title ?? '',
      projectsSubtitle: record.subtitle ?? '',
    }
  }

  const fetchProjectPreviewById = async (id) => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status') || 'draft'
    const queryParams = new URLSearchParams()
    queryParams.set('status', status)
    queryParams.append('populate', '*')
    const response = await fetch(`${STRAPI_PROXY}/projects/${id}?${queryParams}`, { headers: getHeadersWithAuth() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return data.data
  }

  const updateProject = async (id, projectData, statusOverride) => {
    const params = new URLSearchParams(window.location.search)
    const status = statusOverride || params.get('status')
    const queryParams = new URLSearchParams()
    if (status) queryParams.append('status', status)
    queryParams.append('populate', '*')
    const response = await fetch(`${STRAPI_PROXY}/projects/${id}?${queryParams}`, {
      method: 'PUT',
      headers: getHeadersWithAuth(),
      body: JSON.stringify({ data: projectData })
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.data
  }

  const publishProject = async (id) => {
    const response = await fetch(`${STRAPI_PROXY}/projects/${id}?status=published&populate=*`, {
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

  return { fetchProjects, fetchProjectBySlug, fetchProjectsForCarousel, fetchProjectHome, fetchProjectPreviewById, updateProject, publishProject }
}
