import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useArticles } from '../../../app/composables/useArticles.js'

const mockFetch = (ok = true, data: unknown = {}) => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 500,
    json: vi.fn().mockResolvedValueOnce(data),
  } as unknown as Response)
}

describe('useArticles – fetchArticles', () => {
  it('returns a fetchArticles function', () => {
    const { fetchArticles } = useArticles()
    expect(typeof fetchArticles).toBe('function')
  })

  it('calls fetch with the correct base URL', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticles } = useArticles()
    await fetchArticles()
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost:1338/api/articles'),
      expect.any(Object)
    )
  })

  it('includes pagination[page] in the request', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticles } = useArticles()
    await fetchArticles(2)
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('pagination%5Bpage%5D=2')
  })

  it('includes pagination[pageSize] in the request', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticles } = useArticles()
    await fetchArticles(1, 25)
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('pagination%5BpageSize%5D=25')
  })

  it('includes sort parameter in the request', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticles } = useArticles()
    await fetchArticles(1, 10, 'title:asc')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('sort=title%3Aasc')
  })

  it('appends search filters when search is provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticles } = useArticles()
    await fetchArticles(1, 10, 'date:desc', 'criminal justice')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('filters')
    expect(url).toContain('containsi')
  })

  it('does not append search filters when search is empty', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticles } = useArticles()
    await fetchArticles(1, 10, 'date:desc', '')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).not.toContain('%24or')
  })

  it('appends category filter when provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticles } = useArticles()
    await fetchArticles(1, 10, 'date:desc', '', { category: 'Crime' })
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('categories')
  })

  it('appends author filter when provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticles } = useArticles()
    await fetchArticles(1, 10, 'date:desc', '', { author: 'Smith' })
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('authors')
  })

  it('appends year filter with gte and lte when year is provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticles } = useArticles()
    await fetchArticles(1, 10, 'date:desc', '', { year: '2023' })
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('2023-01-01')
    expect(url).toContain('2023-12-31')
  })

  it('throws an error when response is not ok', async () => {
    mockFetch(false)
    const { fetchArticles } = useArticles()
    await expect(fetchArticles()).rejects.toThrow('HTTP error! status: 500')
  })

  it('returns the parsed JSON response', async () => {
    const payload = { data: [{ id: 1, title: 'Test' }], meta: { pagination: {} } }
    mockFetch(true, payload)
    const { fetchArticles } = useArticles()
    const result = await fetchArticles()
    expect(result).toEqual(payload)
  })

  it('uses Content-Type: application/json header', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticles } = useArticles()
    await fetchArticles()
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((opts.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })
})

describe('useArticles – fetchArticleById', () => {
  it('calls fetch with article ID in URL', async () => {
    mockFetch(true, { data: { id: 42, title: 'Test' } })
    const { fetchArticleById } = useArticles()
    await fetchArticleById(42)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/api/articles/42'),
      expect.any(Object)
    )
  })

  it('returns data property from response', async () => {
    const article = { id: 42, title: 'Test Article', slug: 'test' }
    mockFetch(true, { data: article })
    const { fetchArticleById } = useArticles()
    const result = await fetchArticleById(42)
    expect(result).toEqual(article)
  })

  it('throws "Article not found" when data is missing', async () => {
    mockFetch(true, {})
    const { fetchArticleById } = useArticles()
    await expect(fetchArticleById(99)).rejects.toThrow('Article not found')
  })

  it('throws HTTP error when response is not ok', async () => {
    mockFetch(false)
    const { fetchArticleById } = useArticles()
    await expect(fetchArticleById(1)).rejects.toThrow('HTTP error!')
  })

  it('includes populate=* in query string', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { fetchArticleById } = useArticles()
    await fetchArticleById(1)
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('populate')
  })
})

describe('useArticles – fetchArticleBySlug', () => {
  it('calls fetch with slug filter in URL', async () => {
    mockFetch(true, { data: [{ id: 1, slug: 'my-article' }] })
    const { fetchArticleBySlug } = useArticles()
    await fetchArticleBySlug('my-article')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('my-article')
  })

  it('returns the first article in data array', async () => {
    const article = { id: 5, slug: 'found-article' }
    mockFetch(true, { data: [article] })
    const { fetchArticleBySlug } = useArticles()
    const result = await fetchArticleBySlug('found-article')
    expect(result).toEqual(article)
  })

  it('throws "Article not found" when data array is empty', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticleBySlug } = useArticles()
    await expect(fetchArticleBySlug('missing')).rejects.toThrow('Article not found')
  })

  it('throws HTTP error when response is not ok', async () => {
    mockFetch(false)
    const { fetchArticleBySlug } = useArticles()
    await expect(fetchArticleBySlug('slug')).rejects.toThrow('HTTP error!')
  })
})

describe('useArticles – fetchArticlesBasic', () => {
  it('returns data array on success', async () => {
    const list = [{ id: 1, title: 'A' }, { id: 2, title: 'B' }]
    mockFetch(true, { data: list })
    const { fetchArticlesBasic } = useArticles()
    const result = await fetchArticlesBasic()
    expect(result).toEqual(list)
  })

  it('returns empty array when data is missing from response', async () => {
    mockFetch(true, {})
    const { fetchArticlesBasic } = useArticles()
    const result = await fetchArticlesBasic()
    expect(result).toEqual([])
  })

  it('appends title search filter when search is provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticlesBasic } = useArticles()
    await fetchArticlesBasic('climate')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('climate')
  })

  it('uses STRAPI_PROXY path', async () => {
    mockFetch(true, { data: [] })
    const { fetchArticlesBasic } = useArticles()
    await fetchArticlesBasic()
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('/api/strapi')
  })

  it('throws HTTP error when response is not ok', async () => {
    mockFetch(false)
    const { fetchArticlesBasic } = useArticles()
    await expect(fetchArticlesBasic()).rejects.toThrow('HTTP error!')
  })
})

describe('useArticles – updateArticle', () => {
  it('uses PUT method', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateArticle } = useArticles()
    await updateArticle(1, { title: 'Updated' })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(opts.method).toBe('PUT')
  })

  it('sends JSON body', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateArticle } = useArticles()
    await updateArticle(1, { title: 'Test' })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(typeof opts.body).toBe('string')
    const body = JSON.parse(opts.body as string)
    expect(body).toHaveProperty('data')
  })

  it('returns data property from response', async () => {
    const updated = { id: 1, title: 'Updated' }
    mockFetch(true, { data: updated })
    const { updateArticle } = useArticles()
    const result = await updateArticle(1, { title: 'Updated' })
    expect(result).toEqual(updated)
  })

  it('throws when response is not ok', async () => {
    mockFetch(false)
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: vi.fn().mockResolvedValueOnce({ error: { message: 'Validation failed' } }),
    } as unknown as Response)
    const { updateArticle } = useArticles()
    await expect(updateArticle(1, {})).rejects.toThrow()
  })

  it('normalizes Splash field from object with id to just id', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateArticle } = useArticles()
    await updateArticle(1, { Splash: { id: 99, url: '/img.png' } })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body.data.Splash).toBe(99)
  })
})

describe('useArticles – publishArticle', () => {
  it('uses PUT method', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { publishArticle } = useArticles()
    await publishArticle(1)
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(opts.method).toBe('PUT')
  })

  it('includes status=published in the URL', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { publishArticle } = useArticles()
    await publishArticle(1)
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('status=published')
  })

  it('throws when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValueOnce({}),
    } as unknown as Response)
    const { publishArticle } = useArticles()
    await expect(publishArticle(1)).rejects.toThrow()
  })
})
