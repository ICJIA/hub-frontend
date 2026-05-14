import { describe, it, expect, vi } from 'vitest'
import { useSearch } from '../../../app/composables/useSearch.js'
import type { SearchItem } from '../../../app/composables/useSearch.js'

const makeItems = (): SearchItem[] => [
  {
    id: 1,
    type: 'article',
    slug: 'article-one',
    title: 'Crime Statistics Report',
    summary: 'Annual crime data for Illinois',
    content: 'Detailed crime content here',
    categories: ['Crime', 'Statistics'],
    authors: ['Jane Smith'],
    date: '2024-01-10',
    imageUrl: '',
  },
  {
    id: 2,
    type: 'app',
    slug: 'app-one',
    title: 'Data Visualization Tool',
    summary: 'Interactive charts for public safety',
    content: 'App content here',
    categories: ['Tools', 'Data'],
    authors: ['Bob Jones'],
    date: '2024-02-15',
    imageUrl: '/img.png',
  },
  {
    id: 3,
    type: 'dataset',
    slug: 'dataset-one',
    title: 'Arrest Records 2023',
    summary: 'Dataset of arrest records',
    content: 'Dataset content here',
    categories: ['Crime', 'Data'],
    authors: ['Alice Brown'],
    date: '2023-12-01',
    imageUrl: '',
  },
  {
    id: 4,
    type: 'article',
    slug: 'article-two',
    title: 'Juvenile Justice Overview',
    summary: 'Overview of juvenile justice in Illinois',
    content: 'Juvenile content here',
    categories: ['Juvenile', 'Justice'],
    authors: ['Tom Wilson'],
    date: '2024-03-20',
    imageUrl: '',
  },
]

describe('useSearch – return shape', () => {
  it('returns loadIndex function', () => {
    const { loadIndex } = useSearch()
    expect(typeof loadIndex).toBe('function')
  })

  it('returns search function', () => {
    const { search } = useSearch()
    expect(typeof search).toBe('function')
  })

  it('returns searchByType function', () => {
    const { searchByType } = useSearch()
    expect(typeof searchByType).toBe('function')
  })

  it('returns getByType function', () => {
    const { getByType } = useSearch()
    expect(typeof getByType).toBe('function')
  })

  it('isLoaded starts as false for a fresh composable instance', () => {
    const { isLoaded } = useSearch()
    // stateStore is cleared in beforeEach, so each test starts fresh
    expect(isLoaded.value).toBe(false)
  })

  it('isLoading starts as false', () => {
    const { isLoading } = useSearch()
    expect(isLoading.value).toBe(false)
  })

  it('loadError starts as null', () => {
    const { loadError } = useSearch()
    expect(loadError.value).toBeNull()
  })
})

describe('useSearch – search (before index loaded)', () => {
  it('returns empty array for a non-empty query when not loaded', () => {
    const { search } = useSearch()
    expect(search('crime')).toEqual([])
  })

  it('returns empty array for empty query', () => {
    const { search } = useSearch()
    expect(search('')).toEqual([])
  })

  it('returns empty array for whitespace-only query', () => {
    const { search } = useSearch()
    expect(search('   ')).toEqual([])
  })
})

describe('useSearch – getByType (no items loaded)', () => {
  it('returns empty array when items list is empty', () => {
    const { getByType } = useSearch()
    expect(getByType('article')).toEqual([])
  })

  it('returns empty array for app type when items list is empty', () => {
    const { getByType } = useSearch()
    expect(getByType('app')).toEqual([])
  })

  it('returns empty array for dataset type when items list is empty', () => {
    const { getByType } = useSearch()
    expect(getByType('dataset')).toEqual([])
  })
})

describe('useSearch – searchByType (no items loaded)', () => {
  it('returns empty array for an empty query', () => {
    const { searchByType } = useSearch()
    expect(searchByType('', 'article')).toEqual([])
  })

  it('returns empty array when no items match the type', () => {
    const { searchByType } = useSearch()
    expect(searchByType('test', 'article')).toEqual([])
  })
})

describe('useSearch – loadIndex success', () => {
  it('sets isLoaded to true after successful load', async () => {
    const $fetch = (globalThis as Record<string, unknown>).$fetch as ReturnType<typeof vi.fn>
    $fetch.mockResolvedValueOnce(makeItems())
    const { loadIndex, isLoaded } = useSearch()
    await loadIndex()
    expect(isLoaded.value).toBe(true)
  })

  it('sets isLoading to false after successful load', async () => {
    const $fetch = (globalThis as Record<string, unknown>).$fetch as ReturnType<typeof vi.fn>
    $fetch.mockResolvedValueOnce(makeItems())
    const { loadIndex, isLoading } = useSearch()
    await loadIndex()
    expect(isLoading.value).toBe(false)
  })

  it('populates items with loaded data', async () => {
    const items = makeItems()
    const $fetch = (globalThis as Record<string, unknown>).$fetch as ReturnType<typeof vi.fn>
    $fetch.mockResolvedValueOnce(items)
    const { loadIndex, getByType } = useSearch()
    await loadIndex()
    expect(getByType('article').length).toBeGreaterThan(0)
  })

  it('leaves loadError null after successful load', async () => {
    const $fetch = (globalThis as Record<string, unknown>).$fetch as ReturnType<typeof vi.fn>
    $fetch.mockResolvedValueOnce(makeItems())
    const { loadIndex, loadError } = useSearch()
    await loadIndex()
    expect(loadError.value).toBeNull()
  })

  it('does not re-fetch when isLoaded is true (guard works)', async () => {
    const $fetch = (globalThis as Record<string, unknown>).$fetch as ReturnType<typeof vi.fn>
    $fetch.mockResolvedValue(makeItems())
    const { loadIndex, isLoaded } = useSearch()
    await loadIndex()
    // Manually set isLoaded to simulate the guard
    isLoaded.value = true
    await loadIndex()
    // Only 1 call should have been made (second is short-circuited)
    expect($fetch).toHaveBeenCalledTimes(1)
  })
})

describe('useSearch – loadIndex error', () => {
  it('sets loadError when fetch fails', async () => {
    const $fetch = (globalThis as Record<string, unknown>).$fetch as ReturnType<typeof vi.fn>
    $fetch.mockRejectedValueOnce(new Error('Network error'))
    const { loadIndex, loadError } = useSearch()
    await loadIndex()
    expect(loadError.value).toBeTruthy()
  })

  it('sets isLoading to false after error', async () => {
    const $fetch = (globalThis as Record<string, unknown>).$fetch as ReturnType<typeof vi.fn>
    $fetch.mockRejectedValueOnce(new Error('Network error'))
    const { loadIndex, isLoading } = useSearch()
    await loadIndex()
    expect(isLoading.value).toBe(false)
  })

  it('leaves isLoaded false after error', async () => {
    const $fetch = (globalThis as Record<string, unknown>).$fetch as ReturnType<typeof vi.fn>
    $fetch.mockRejectedValueOnce(new Error('Network error'))
    const { loadIndex, isLoaded } = useSearch()
    await loadIndex()
    expect(isLoaded.value).toBe(false)
  })
})

describe('useSearch – getByType after load', () => {
  const loadWithItems = async () => {
    const $fetch = (globalThis as Record<string, unknown>).$fetch as ReturnType<typeof vi.fn>
    $fetch.mockResolvedValueOnce(makeItems())
    const composable = useSearch()
    await composable.loadIndex()
    return composable
  }

  it('returns only articles', async () => {
    const { getByType } = await loadWithItems()
    const articles = getByType('article')
    expect(articles.every(i => i.type === 'article')).toBe(true)
  })

  it('returns only apps', async () => {
    const { getByType } = await loadWithItems()
    const apps = getByType('app')
    expect(apps.every(i => i.type === 'app')).toBe(true)
  })

  it('returns only datasets', async () => {
    const { getByType } = await loadWithItems()
    const datasets = getByType('dataset')
    expect(datasets.every(i => i.type === 'dataset')).toBe(true)
  })

  it('returns 2 articles from test data', async () => {
    const { getByType } = await loadWithItems()
    expect(getByType('article')).toHaveLength(2)
  })

  it('searchByType returns empty for whitespace query (returns all of type)', async () => {
    const { searchByType } = await loadWithItems()
    const result = searchByType('', 'article')
    expect(result.every(i => i.type === 'article')).toBe(true)
  })

  it('searchByType with query returns results of the correct type', async () => {
    const { searchByType } = await loadWithItems()
    const result = searchByType('crime', 'article')
    expect(result.every(i => i.type === 'article')).toBe(true)
  })

  it('search with empty query returns empty array', async () => {
    const { search } = await loadWithItems()
    expect(search('')).toEqual([])
  })

  it('search with whitespace query returns empty array', async () => {
    const { search } = await loadWithItems()
    expect(search('   ')).toEqual([])
  })
})
