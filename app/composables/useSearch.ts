import Fuse from 'fuse.js'

export interface SearchItem {
  id: number
  type: 'article' | 'app' | 'dataset'
  slug: string
  title: string
  summary: string
  content: string
  categories: string[]
  authors: string[]
  date: string
  imageUrl: string
}

const FUSE_OPTIONS: Fuse.IFuseOptions<SearchItem> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'summary', weight: 0.3 },
    { name: 'content', weight: 0.15 },
    { name: 'categories', weight: 0.1 },
    { name: 'authors', weight: 0.05 }
  ],
  threshold: 0.4,
  minMatchCharLength: 2,
  includeScore: true,
  ignoreLocation: true
}

// Fuse instance is not serialisable — keep as module-level (client-only usage)
let _fuse: Fuse<SearchItem> | null = null
// Deduplication: only one in-flight fetch at a time
let _inflight: Promise<void> | null = null

export const useSearch = () => {
  // useState makes these reactive across all components and Vue navigations.
  // On SSR they are request-scoped; on the client they persist for the session.
  const items = useState<SearchItem[]>('search:items', () => [])
  const isLoaded = useState<boolean>('search:loaded', () => false)
  const isLoading = useState<boolean>('search:loading', () => false)
  const loadError = useState<string | null>('search:error', () => null)

  const loadIndex = async (): Promise<void> => {
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
        _fuse = new Fuse(data, FUSE_OPTIONS)
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
   * Fuzzy-search items of a specific type.
   * Returns the full set for that type when the query is empty.
   */
  const searchByType = (query: string, type: SearchItem['type']): SearchItem[] => {
    const base = items.value.filter(i => i.type === type)
    if (!query.trim() || !_fuse) return base
    return _fuse.search(query).map(r => r.item).filter(i => i.type === type)
  }

  /** Global cross-type fuzzy search (used by /search page). */
  const search = (query: string): SearchItem[] => {
    if (!query.trim() || !_fuse) return []
    return _fuse.search(query, { limit: 60 }).map(r => r.item)
  }

  return { loadIndex, search, searchByType, getByType, isLoaded, isLoading, loadError }
}
