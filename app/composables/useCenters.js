export const useCenters = () => {
  const fetchCenterHome = async () => {
    const response = await fetch(`${API_BASE_URL}/api/centerhomes?pagination[pageSize]=1`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    const record = data.data?.[0]
    if (!record) throw new Error('Center home not found')
    return {
      heroTitle: record.Herotitle ?? '',
      heroSubtitle: record.Herosubtitle ?? '',
      sectionTitle: record.Title ?? '',
      subtitle: record.subtitle ?? '',
    }
  }

  const fetchCenters = async () => {
    const params = new URLSearchParams({
      sort: 'Title:asc',
      'pagination[pageSize]': '100',
    })
    const response = await fetch(`${API_BASE_URL}/api/centers?${params}`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    return (data.data || []).map(c => ({
      id: c.id,
      name: c.Title ?? '',
      manager: c.Author ?? '',
      description: c.Description ?? '',
    }))
  }

  return { fetchCenterHome, fetchCenters }
}
