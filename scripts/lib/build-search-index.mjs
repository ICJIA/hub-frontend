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

const EXCEL_EXTS = new Set(['.xlsx', '.xls', '.csv'])

/**
 * Normalise a Strapi file reference into the lightweight shape we embed on
 * search-index items. Returns null when the input isn't a usable file ref.
 *
 * `indexedUrl` is where pagefind crawls (and what search results point at);
 * `fileUrl` is the raw Strapi URL used for direct download / browser viewer.
 */
function normaliseFile(file, apiBaseUrl) {
  if (!file?.hash) return null
  const ext = String(file.ext ?? '').toLowerCase()
  const isPdf = ext === '.pdf'
  const isExcel = EXCEL_EXTS.has(ext)
  const fileType = isPdf ? 'pdf' : isExcel ? 'excel' : 'other'

  const indexedUrl = isPdf
    ? `/attachments/${file.hash}.pdf`
    : isExcel
      ? `/attachments/excel/${file.hash}.html`
      : null

  const rawUrl = file.url ?? ''
  const fileUrl = rawUrl.startsWith('/') ? `${apiBaseUrl}${rawUrl}` : rawUrl

  return {
    hash: file.hash,
    name: file.name ?? `${file.hash}${ext}`,
    ext,
    fileType,
    fileUrl,
    indexedUrl
  }
}

/** Pull the file list off an article (single `mainfile`) or dataset (`datafile` array). */
function collectFiles(item, fieldName, apiBaseUrl) {
  const ref = item?.[fieldName]
  if (!ref) return []
  const list = Array.isArray(ref) ? ref : [ref]
  return list.map(f => normaliseFile(f, apiBaseUrl)).filter(Boolean)
}

/**
 * Build a hash → [parents] map from the file references on articles and
 * datasets. Used at search-time to show "Found in: <Article Title>" on file
 * result cards. A single file can be referenced by multiple parents, hence
 * the array.
 */
function buildFileParents({ articles, datasets }) {
  /** @type {Record<string, Array<{ type: string, slug: string, title: string, url: string }>>} */
  const map = {}

  const addRef = (file, parent) => {
    const hash = file?.hash
    if (!hash) return
    if (!map[hash]) map[hash] = []
    // Avoid duplicates if the same parent references the same file twice
    if (!map[hash].some(p => p.type === parent.type && p.slug === parent.slug)) {
      map[hash].push(parent)
    }
  }

  for (const a of articles) {
    const slug = a.slug ?? ''
    if (!slug) continue
    const parent = { type: 'article', slug, title: a.title ?? '', url: `/articles/${slug}` }
    addRef(a.mainfile, parent)
  }

  for (const d of datasets) {
    const slug = d.slug ?? ''
    if (!slug) continue
    const parent = { type: 'dataset', slug, title: d.title ?? '', url: `/datasets/${slug}` }
    const datafile = d.datafile
    if (Array.isArray(datafile)) {
      for (const f of datafile) addRef(f, parent)
    } else if (datafile && typeof datafile === 'object') {
      addRef(datafile, parent)
    }
  }

  return map
}

/**
 * Fetch all content from Strapi and return a normalised search index array.
 *
 * @param {{ apiBaseUrl: string, bearerToken: string }} options
 * @returns {{ index: object[], fileParents: Record<string, Array<object>>, counts: { articles: number, apps: number, datasets: number } }}
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
      imageUrl: resolveUrl(a.splash?.url ?? ''),
      files: collectFiles(a, 'mainfile', apiBaseUrl)
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
      imageUrl: '',
      files: collectFiles(d, 'datafile', apiBaseUrl)
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

  const fileParents = buildFileParents({ articles, datasets })

  return {
    index,
    fileParents,
    counts: { articles: articles.length, apps: apps.length, datasets: datasets.length, projects: projects.length, projecthomes: projecthomes.length }
  }
}
