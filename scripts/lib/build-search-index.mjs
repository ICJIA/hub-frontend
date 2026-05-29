/**
 * Shared search-index build logic.
 * Used by both the CLI script (scripts/generate-search-index.mjs) and
 * the Nitro `compiled` hook in nuxt.config.ts.
 *
 * Any change to Strapi field mapping, markdown stripping, or author/image
 * resolution only needs to happen here.
 */

/** Strip basic markdown syntax so Fuse matches text content, not symbols. */
export function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/^>\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Fetch all pages of a Strapi collection endpoint.
 * Returns a flat array of item data objects.
 */
export async function fetchAllItems(endpoint, { apiBaseUrl, headers }) {
  const items = []
  let page = 1
  const pageSize = 100

  while (true) {
    const params = new URLSearchParams({
      populate: '*',
      'pagination[page]': String(page),
      'pagination[pageSize]': String(pageSize),
      sort: 'date:desc'
    })
    console.log(`${apiBaseUrl}/api/${endpoint}?${params}`);
    const res = await fetch(`${apiBaseUrl}/api/${endpoint}?${params}`, { headers })
    if (!res.ok) throw new Error(`[${endpoint}] HTTP ${res.status}: ${res.statusText}`)

    const json = await res.json()
    items.push(...(json.data || []))

    const pagination = json.meta?.pagination
    if (!pagination || page >= pagination.pageCount) break
    page++
  }

  return items
}

/**
 * Fetch all content from Strapi and return a normalised search index array.
 *
 * @param {{ apiBaseUrl: string, bearerToken: string }} options
 * @returns {{ index: object[], counts: { articles: number, apps: number, datasets: number } }}
 */
export async function buildIndex({ apiBaseUrl, bearerToken }) {
  const headers = {
    'Content-Type': 'application/json',
    ...(bearerToken && { Authorization: `Bearer ${bearerToken}` })
  }

  const [articles, apps, datasets, projects, projecthomes] = await Promise.all([
    fetchAllItems('articles', { apiBaseUrl, headers }),
    fetchAllItems('apps', { apiBaseUrl, headers }),
    fetchAllItems('datasets', { apiBaseUrl, headers }),
    fetchAllItems('projects', { apiBaseUrl, headers }),
    fetchAllItems('projecthomes', { apiBaseUrl, headers })

  ])

  const resolveUrl = (url) => {
    if (!url) return ''
    return url.startsWith('/') ? `${apiBaseUrl}${url}` : url
  }

  const index = [
    ...articles.map(a => ({
      id: a.id,
      type: 'article',
      slug: a.slug ?? '',
      title: a.title ?? '',
      summary: a.abstract ?? '',
      content: stripMarkdown(a.markdown ?? '').slice(0, 3000),
      categories: Array.isArray(a.categories) ? a.categories.filter(Boolean) : [],
      authors: Array.isArray(a.authors)
        ? a.authors.map(x => (typeof x === 'string' ? x : (x?.title || x?.name || x?.Name || '')).trim()).filter(Boolean)
        : [],
      date: a.date ?? '',
      imageUrl: resolveUrl(a.splash?.url ?? '')
    })),
    ...apps.map(a => ({
      id: a.id,
      type: 'app',
      slug: a.slug ?? '',
      title: a.title ?? '',
      summary: a.description ?? '',
      content: '',
      categories: Array.isArray(a.categories) ? a.categories.filter(Boolean) : [],
      authors: Array.isArray(a.contributors)
        ? a.contributors.map(x => (typeof x === 'string' ? x : (x?.name || x?.Name || '')).trim()).filter(Boolean)
        : [],
      date: a.date ?? '',
      imageUrl: resolveUrl(Array.isArray(a.image) ? (a.image[0]?.url ?? '') : (a.image?.url ?? ''))
    })),
    ...datasets.map(d => ({
      id: d.id,
      type: 'dataset',
      slug: d.slug ?? '',
      title: d.title ?? '',
      summary: d.description ?? '',
      content: '',
      categories: Array.isArray(d.categories) ? d.categories.filter(Boolean) : [],
      authors: [],
      date: d.date ?? '',
      imageUrl: ''
    })),
    ...projects.map(p => ({
      id: p.id,
      type: 'project',
      slug: p.slug ?? '',
      title: p.Title ?? p.title ?? '',
      summary: p.SubTitle ?? p.tagline ?? '',
      content: stripMarkdown(p.Body ?? p.body ?? '').slice(0, 3000),
      categories: [],
      authors: Array.isArray(p.Authors) ? p.Authors.filter(Boolean) : [],
      date: p.date ?? '',
      imageUrl: ''
    })),
    ...projecthomes.map(h => ({
      id: h.id,
      type: 'projecthome',
      slug: 'projects',
      title: h.Herotitle ?? '',
      summary: h.Herosubtitle ?? '',
      content: [h.Title, h.subtitle].filter(Boolean).join(' '),
      categories: [],
      authors: [],
      date: h.updatedAt ?? '',
      imageUrl: ''
    }))
  ]

  return { index, counts: { articles: articles.length, apps: apps.length, datasets: datasets.length, projects: projects.length, projecthomes: projecthomes.length } }
}
