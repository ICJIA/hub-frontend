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

  return { fetchProjects, fetchProjectBySlug }
}
