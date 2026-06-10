export interface AttachedFile {
  hash: string
  name: string
  ext: string
  fileType: 'pdf' | 'excel' | 'other'
  /** Direct (Strapi) URL for download or external viewer. */
  fileUrl: string
  /** Local indexed URL where pagefind crawls — null when the file type isn't indexed. */
  indexedUrl: string | null
}

export interface SearchItem {
  id: number
  type: 'article' | 'app' | 'dataset' | 'project'
  slug: string
  title: string
  summary: string
  content: string
  categories: string[]
  authors: string[]
  date: string
  imageUrl: string
  files?: AttachedFile[]
}

// Module-level singletons — client-only.
// On a Node server the module is shared across requests, so these must never
// be written during SSR. loadIndex() guards against this with an
// import.meta.client check; callers must only invoke it from onMounted or
// other client-side lifecycle hooks, never from setup() or useAsyncData.
let _inflight: Promise<void> | null = null

export const useSearch = () => {
  // useState makes these reactive across all components and Vue navigations.
  // On SSR they are request-scoped; on the client they persist for the session.
  const items = useState<SearchItem[]>('search:items', () => [])
  const isLoaded = useState<boolean>('search:loaded', () => false)
  const isLoading = useState<boolean>('search:loading', () => false)
  const loadError = useState<string | null>('search:error', () => null)

  const loadIndex = async (): Promise<void> => {
    if (!import.meta.client) return
    if (isLoaded.value) return
    if (_inflight) {
      await _inflight
      return
    }

    isLoading.value = true
    loadError.value = null

    _inflight = (async () => {
      try {
        const data = await $fetch<SearchItem[]>('/search-index.json')
        items.value = data
        isLoaded.value = true
      } catch {
        loadError.value = 'Search index not available. Run `pnpm generate:search` locally, or deploy to build it automatically.'
      } finally {
        isLoading.value = false
        _inflight = null
      }
    })()

    await _inflight
  }

  /** All indexed items of a given content type. */
  const getByType = (type: SearchItem['type']): SearchItem[] =>
    items.value.filter(i => i.type === type)

  /**
   * Filter items of a specific type by a case-insensitive substring match
   * across title, summary, content, categories, and authors.
   * Returns the full set for that type when the query is empty.
   */
  const searchByType = (query: string, type: SearchItem['type']): SearchItem[] => {
    const base = items.value.filter(i => i.type === type)
    if (!query.trim()) return base
    const q = query.toLowerCase()
    return base.filter(item =>
      item.title.toLowerCase().includes(q)
      || item.summary.toLowerCase().includes(q)
      || item.content.toLowerCase().includes(q)
      || item.categories.some(c => c.toLowerCase().includes(q))
      || item.authors.some(a => a.toLowerCase().includes(q))
    )
  }

  return { loadIndex, searchByType, getByType, items, isLoaded, isLoading, loadError }
}
