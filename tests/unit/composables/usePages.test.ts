import { describe, it, expect, vi } from 'vitest'
import { usePages } from '../../../app/composables/usePages.js'

const mockFetch = (ok = true, data: unknown = {}) => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 404,
    json: vi.fn().mockResolvedValueOnce(data),
  } as unknown as Response)
}

describe('usePages – fetchPageBySlug', () => {
  it('returns a fetchPageBySlug function', () => {
    const { fetchPageBySlug } = usePages()
    expect(typeof fetchPageBySlug).toBe('function')
  })

  it('calls the correct API endpoint', async () => {
    mockFetch(true, { data: [{ id: 1, slug: 'about' }] })
    const { fetchPageBySlug } = usePages()
    await fetchPageBySlug('about')
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/api/pages'),
      expect.any(Object)
    )
  })

  it('includes slug filter in the URL', async () => {
    mockFetch(true, { data: [{ id: 1, slug: 'contact' }] })
    const { fetchPageBySlug } = usePages()
    await fetchPageBySlug('contact')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('contact')
  })

  it('returns the first page from data array', async () => {
    const page = { id: 3, slug: 'about', title: 'About Us' }
    mockFetch(true, { data: [page] })
    const { fetchPageBySlug } = usePages()
    const result = await fetchPageBySlug('about')
    expect(result).toEqual(page)
  })

  it('throws "Page not found" with slug when data array is empty', async () => {
    mockFetch(true, { data: [] })
    const { fetchPageBySlug } = usePages()
    await expect(fetchPageBySlug('missing-slug')).rejects.toThrow('Page not found: missing-slug')
  })

  it('throws HTTP error when response is not ok', async () => {
    mockFetch(false)
    const { fetchPageBySlug } = usePages()
    await expect(fetchPageBySlug('some-slug')).rejects.toThrow('HTTP error!')
  })

  it('uses Content-Type: application/json header', async () => {
    mockFetch(true, { data: [{ id: 1 }] })
    const { fetchPageBySlug } = usePages()
    await fetchPageBySlug('test')
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect((opts.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('uses the API_BASE_URL for the request', async () => {
    mockFetch(true, { data: [{ id: 1 }] })
    const { fetchPageBySlug } = usePages()
    await fetchPageBySlug('home')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('http://localhost:1338')
  })

  it('handles slug with hyphens correctly', async () => {
    mockFetch(true, { data: [{ id: 5, slug: 'privacy-policy' }] })
    const { fetchPageBySlug } = usePages()
    const result = await fetchPageBySlug('privacy-policy')
    expect(result).toHaveProperty('slug', 'privacy-policy')
  })

  it('throws error message that includes the missing slug', async () => {
    mockFetch(true, { data: [] })
    const { fetchPageBySlug } = usePages()
    try {
      await fetchPageBySlug('non-existent')
      expect.fail('Should have thrown')
    } catch (e) {
      expect((e as Error).message).toContain('non-existent')
    }
  })
})
