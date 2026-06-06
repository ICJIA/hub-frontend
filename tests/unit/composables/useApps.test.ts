import { describe, it, expect, vi } from 'vitest'
import { useApps } from '../../../app/composables/useApps.js'

const mockFetch = (ok = true, data: unknown = {}) => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 500,
    json: vi.fn().mockResolvedValueOnce(data),
  } as unknown as Response)
}

describe('useApps – fetchApps', () => {
  it('returns a fetchApps function', () => {
    const { fetchApps } = useApps()
    expect(typeof fetchApps).toBe('function')
  })

  it('calls the correct API endpoint', async () => {
    mockFetch(true, { data: [] })
    const { fetchApps } = useApps()
    await fetchApps()
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/api/apps'),
      expect.any(Object)
    )
  })

  it('includes pagination page parameter', async () => {
    mockFetch(true, { data: [] })
    const { fetchApps } = useApps()
    await fetchApps(3)
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('pagination%5Bpage%5D=3')
  })

  it('includes pagination pageSize parameter', async () => {
    mockFetch(true, { data: [] })
    const { fetchApps } = useApps()
    await fetchApps(1, 20)
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('pagination%5BpageSize%5D=20')
  })

  it('includes sort parameter', async () => {
    mockFetch(true, { data: [] })
    const { fetchApps } = useApps()
    await fetchApps(1, 10, 'title:asc')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('sort=title%3Aasc')
  })

  it('appends search filter when search is provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchApps } = useApps()
    await fetchApps(1, 10, 'date:desc', 'mapping tool')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('filters')
  })

  it('does not append search filter for empty search', async () => {
    mockFetch(true, { data: [] })
    const { fetchApps } = useApps()
    await fetchApps(1, 10, 'date:desc', '')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).not.toContain('%24or')
  })

  it('appends category filter when provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchApps } = useApps()
    await fetchApps(1, 10, 'date:desc', '', { category: 'Tools' })
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('categories')
  })

  it('appends contributor/author filter when provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchApps } = useApps()
    await fetchApps(1, 10, 'date:desc', '', { author: 'Smith' })
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('contributors')
  })

  it('appends year filter with gte and lte bounds', async () => {
    mockFetch(true, { data: [] })
    const { fetchApps } = useApps()
    await fetchApps(1, 10, 'date:desc', '', { year: '2022' })
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('2022-01-01')
    expect(url).toContain('2022-12-31')
  })

  it('throws HTTP error when response is not ok', async () => {
    mockFetch(false)
    const { fetchApps } = useApps()
    await expect(fetchApps()).rejects.toThrow('HTTP error! status: 500')
  })

  it('returns the parsed JSON response', async () => {
    const payload = { data: [{ id: 1 }], meta: {} }
    mockFetch(true, payload)
    const { fetchApps } = useApps()
    const result = await fetchApps()
    expect(result).toEqual(payload)
  })
})

describe('useApps – fetchAppById', () => {
  it('calls fetch with app ID in URL', async () => {
    mockFetch(true, { data: { id: 7 } })
    const { fetchAppById } = useApps()
    await fetchAppById(7)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/api/apps/7'),
      expect.any(Object)
    )
  })

  it('returns data property from response', async () => {
    const app = { id: 7, title: 'Crime Map' }
    mockFetch(true, { data: app })
    const { fetchAppById } = useApps()
    const result = await fetchAppById(7)
    expect(result).toEqual(app)
  })

  it('throws "App not found" when data is missing', async () => {
    mockFetch(true, {})
    const { fetchAppById } = useApps()
    await expect(fetchAppById(99)).rejects.toThrow('App not found')
  })

  it('throws HTTP error when response is not ok', async () => {
    mockFetch(false)
    const { fetchAppById } = useApps()
    await expect(fetchAppById(1)).rejects.toThrow('HTTP error!')
  })
})

describe('useApps – fetchAppBySlug', () => {
  it('calls fetch with slug filter in URL', async () => {
    mockFetch(true, { data: [{ id: 1, slug: 'crime-map' }] })
    const { fetchAppBySlug } = useApps()
    await fetchAppBySlug('crime-map')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('crime-map')
  })

  it('returns the first app from data array', async () => {
    const app = { id: 3, slug: 'data-tool' }
    mockFetch(true, { data: [app] })
    const { fetchAppBySlug } = useApps()
    const result = await fetchAppBySlug('data-tool')
    expect(result).toEqual(app)
  })

  it('throws "App not found" when data array is empty', async () => {
    mockFetch(true, { data: [] })
    const { fetchAppBySlug } = useApps()
    await expect(fetchAppBySlug('nonexistent')).rejects.toThrow('App not found')
  })

  it('throws HTTP error when not ok', async () => {
    mockFetch(false)
    const { fetchAppBySlug } = useApps()
    await expect(fetchAppBySlug('slug')).rejects.toThrow('HTTP error!')
  })
})

describe('useApps – getAppImageUrl', () => {
  it('returns null when app has no image', () => {
    const { getAppImageUrl } = useApps()
    expect(getAppImageUrl({ image: null })).toBeNull()
  })

  it('returns null when app is null', () => {
    const { getAppImageUrl } = useApps()
    expect(getAppImageUrl(null)).toBeNull()
  })

  it('returns full URL when image url starts with /', () => {
    const { getAppImageUrl } = useApps()
    const result = getAppImageUrl({ image: { url: '/uploads/img.png' } })
    expect(result).toBe('http://localhost:1338/uploads/img.png')
  })

  it('returns image url as-is when it starts with http', () => {
    const { getAppImageUrl } = useApps()
    const result = getAppImageUrl({ image: { url: 'https://cdn.example.com/img.png' } })
    expect(result).toBe('https://cdn.example.com/img.png')
  })

  it('returns first image when image is an array', () => {
    const { getAppImageUrl } = useApps()
    const result = getAppImageUrl({
      image: [{ url: '/uploads/first.png' }, { url: '/uploads/second.png' }],
    })
    expect(result).toBe('http://localhost:1338/uploads/first.png')
  })

  it('returns null when image array is empty', () => {
    const { getAppImageUrl } = useApps()
    expect(getAppImageUrl({ image: [] })).toBeNull()
  })
})

describe('useApps – updateApp', () => {
  it('uses PUT method', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateApp } = useApps()
    await updateApp(1, { title: 'Updated' })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(opts.method).toBe('PUT')
  })

  it('normalizes image as numeric id to array', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateApp } = useApps()
    await updateApp(1, { image: 5 })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body.data.image).toEqual([5])
  })

  it('normalizes image as object with id to array of id', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateApp } = useApps()
    await updateApp(1, { image: { id: 7, url: '/img.png' } })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body.data.image).toEqual([7])
  })

  it('normalizes image as null to empty array', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateApp } = useApps()
    await updateApp(1, { image: null })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body.data.image).toEqual([])
  })

  it('normalizes articles array to IDs', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateApp } = useApps()
    await updateApp(1, { articles: [{ id: 10 }, { id: 20 }] })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body.data.articles).toEqual([10, 20])
  })

  it('normalizes datasets array to IDs', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateApp } = useApps()
    await updateApp(1, { datasets: [{ id: 30 }] })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body.data.datasets).toEqual([30])
  })

  it('throws when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValueOnce({ error: { message: 'Bad data' } }),
    } as unknown as Response)
    const { updateApp } = useApps()
    await expect(updateApp(1, {})).rejects.toThrow('Bad data')
  })
})

describe('useApps – publishApp', () => {
  it('uses PUT method', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { publishApp } = useApps()
    await publishApp(1)
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(opts.method).toBe('PUT')
  })

  it('includes status=published in URL', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { publishApp } = useApps()
    await publishApp(1)
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('status=published')
  })

  it('throws when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValueOnce({}),
    } as unknown as Response)
    const { publishApp } = useApps()
    await expect(publishApp(1)).rejects.toThrow()
  })
})

describe('useApps – fetchAppsBasic', () => {
  it('returns data array on success', async () => {
    const list = [{ id: 1, title: 'App A' }]
    mockFetch(true, { data: list })
    const { fetchAppsBasic } = useApps()
    const result = await fetchAppsBasic()
    expect(result).toEqual(list)
  })

  it('returns empty array when data is missing', async () => {
    mockFetch(true, {})
    const { fetchAppsBasic } = useApps()
    const result = await fetchAppsBasic()
    expect(result).toEqual([])
  })

  it('appends title search filter when search is provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchAppsBasic } = useApps()
    await fetchAppsBasic('mapping')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('mapping')
  })
})
