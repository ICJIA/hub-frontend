/**
 * Client-side pagefind composable.
 *
 * Pagefind is a static search index generated at build time by running
 * `pnpm pagefind:build` after `nuxt build`. Its JS bundle lives at
 * /pagefind/pagefind.js in the compiled site.
 *
 * Result enrichment: pagefind returns URLs + excerpts. To avoid extra API
 * calls, each result is enriched with its full metadata (imageUrl, categories,
 * authors, date) by looking it up in the pre-built search-index.json loaded
 * here alongside the pagefind engine.
 */

import type { SearchItem } from './useSearch'

export interface PagefindResult {
  item: SearchItem | null
  url: string
  /** HTML string with <mark> tags for matched terms — safe to v-html. */
  excerpt: string
  type: 'article' | 'app' | 'dataset' | 'project' | 'file'
  slug: string
  /** For file results: the actual downloadable/viewable file URL. */
  fileUrl?: string
  /** Display name for file results. */
  fileName?: string
  /** Distinguishes indexed media types. */
  fileType?: 'pdf' | 'excel'
}

interface RawPagefindResult {
  url: string
  excerpt: string
  meta: Record<string, string>
  sub_results?: Array<{ title: string; url: string; excerpt: string }>
}

// Module-level singletons — client-only, never written during SSR.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pagefind: any = null
let _inflight: Promise<void> | null = null

export const usePagefind = () => {
  const isLoaded = useState<boolean>('pagefind:loaded', () => false)
  const isLoading = useState<boolean>('pagefind:loading', () => false)
  const loadError = useState<string | null>('pagefind:error', () => null)

  // Metadata items loaded from search-index.json — used only for enrichment.
  // Stored in a separate useState key so it doesn't conflict with useSearch.
  const metaItems = useState<SearchItem[]>('pagefind:meta', () => [])

  const load = async (): Promise<void> => {
    if (!import.meta.client) return
    if (isLoaded.value) return
    if (_inflight) { await _inflight; return }

    isLoading.value = true
    loadError.value = null

    _inflight = (async () => {
      try {
        // Load both in parallel: pagefind engine + metadata index
        const [pagefindModule, metaData] = await Promise.all([
          // Pagefind is a build-time asset, not an npm module — @vite-ignore
          // prevents Vite from trying to bundle it at compile time.
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          import(/* @vite-ignore */ '/pagefind/pagefind.js'),
          $fetch<SearchItem[]>('/search-index.json').catch(() => [] as SearchItem[])
        ])

        _pagefind = pagefindModule
        await _pagefind.init()
        metaItems.value = metaData
        isLoaded.value = true
      } catch {
        loadError.value =
          'Search index not available. Run `pnpm build:full` (or `pnpm build && pnpm pagefind:build`) to generate it.'
      } finally {
        isLoading.value = false
        _inflight = null
      }
    })()

    await _inflight
  }

  /** Search via pagefind. Returns up to 60 results enriched with search-index.json metadata. */
  const search = async (query: string): Promise<PagefindResult[]> => {
    if (!query.trim() || !_pagefind) return []

    const response = await _pagefind.search(query)
    if (!response?.results?.length) return []

    const rawResults: RawPagefindResult[] = await Promise.all(
      response.results
        .slice(0, 60)
        .map((r: { data: () => Promise<RawPagefindResult> }) => r.data())
    )

    return rawResults.map((raw) => {
      // ── File results: PDFs indexed directly, Excel via HTML stubs ──────────
      if (raw.url.endsWith('.pdf')) {
        return {
          item: null,
          url: raw.url,
          excerpt: raw.excerpt,
          type: 'file',
          slug: '',
          fileType: 'pdf',
          fileUrl: raw.url,
          fileName: raw.meta?.title ?? raw.url.split('/').pop() ?? ''
        }
      }

      if (/\/attachments\/excel\//.test(raw.url)) {
        return {
          item: null,
          url: raw.url,
          excerpt: raw.excerpt,
          type: 'file',
          slug: '',
          fileType: 'excel',
          fileUrl: raw.meta?.fileUrl ?? '',
          fileName: raw.meta?.title ?? ''
        }
      }

      // ── Content results: articles, apps, datasets ────────────────────────
      // Derive content type and slug from the URL path:
      //   /articles/my-slug  → type='article',  slug='my-slug'
      //   /apps/my-slug      → type='app',      slug='my-slug'
      //   /datasets/my-slug  → type='dataset',  slug='my-slug'
      const match = raw.url.match(/^\/(articles|apps|datasets)\/([^/?#]+)/)
      const urlSegment = match?.[1]
      const slug = match?.[2] ?? ''

      const typeMap: Record<string, PagefindResult['type']> = {
        articles: 'article',
        apps: 'app',
        datasets: 'dataset'
      }
      const type: PagefindResult['type'] = typeMap[urlSegment ?? ''] ?? 'article'

      const item = urlSegment
        ? (metaItems.value.find((i: SearchItem) => i.type === type && i.slug === slug) ?? null)
        : null

      return { item, url: raw.url, excerpt: raw.excerpt, type, slug }
    })
  }

  return { load, search, isLoaded, isLoading, loadError }
}
