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
        url: `/programs/${p.slug}`,
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

  return { fetchProjects, fetchProjectBySlug, fetchProjectsForCarousel, fetchProjectHome }
}
