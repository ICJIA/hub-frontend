export const usePages = () => {
  const fetchPageBySlug = async (slug) => {
    const params = new URLSearchParams({
      'filters[slug][$eq]': slug
    })
    const response = await fetch(`${API_BASE_URL}/api/pages?${params}`, { headers: getHeaders() })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()
    if (data.data?.[0]) return data.data[0]
    throw new Error(`Page not found: ${slug}`)
  }

  return { fetchPageBySlug }
}
