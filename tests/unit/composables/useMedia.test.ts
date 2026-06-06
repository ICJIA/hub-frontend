import { describe, it, expect, vi } from 'vitest'
import { useMedia } from '../../../app/composables/useMedia.js'

const mockFetch = (ok = true, data: unknown = {}) => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 400,
    json: vi.fn().mockResolvedValueOnce(data),
  } as unknown as Response)
}

describe('useMedia – uploadMedia', () => {
  it('returns an uploadMedia function', () => {
    const { uploadMedia } = useMedia()
    expect(typeof uploadMedia).toBe('function')
  })

  it('calls the upload endpoint with POST method', async () => {
    const file = [{ id: 1, url: '/uploads/img.png', name: 'img.png' }]
    mockFetch(true, file)
    const { uploadMedia } = useMedia()
    const mockFile = new File(['content'], 'test.png', { type: 'image/png' })
    await uploadMedia(mockFile)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/upload'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('sends the file as FormData', async () => {
    const file = [{ id: 1, url: '/uploads/img.png', name: 'img.png' }]
    mockFetch(true, file)
    const { uploadMedia } = useMedia()
    const mockFile = new File(['data'], 'file.png', { type: 'image/png' })
    await uploadMedia(mockFile)
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(opts.body).toBeInstanceOf(FormData)
  })

  it('returns the first uploaded file on success', async () => {
    const uploaded = { id: 5, url: '/uploads/photo.jpg', name: 'photo.jpg' }
    mockFetch(true, [uploaded])
    const { uploadMedia } = useMedia()
    const mockFile = new File(['data'], 'photo.jpg', { type: 'image/jpeg' })
    const result = await uploadMedia(mockFile)
    expect(result).toEqual(uploaded)
  })

  it('throws when response is not ok', async () => {
    mockFetch(false)
    const { uploadMedia } = useMedia()
    const mockFile = new File(['data'], 'bad.txt', { type: 'text/plain' })
    await expect(uploadMedia(mockFile)).rejects.toThrow('Upload failed')
  })

  it('throws when response returns empty array', async () => {
    mockFetch(true, [])
    const { uploadMedia } = useMedia()
    const mockFile = new File(['data'], 'test.png', { type: 'image/png' })
    await expect(uploadMedia(mockFile)).rejects.toThrow('Upload succeeded but returned no files')
  })

  it('throws when response returns non-array', async () => {
    mockFetch(true, { error: 'bad' })
    const { uploadMedia } = useMedia()
    const mockFile = new File(['data'], 'test.png', { type: 'image/png' })
    await expect(uploadMedia(mockFile)).rejects.toThrow()
  })
})

describe('useMedia – fetchMediaFiles', () => {
  it('returns a fetchMediaFiles function', () => {
    const { fetchMediaFiles } = useMedia()
    expect(typeof fetchMediaFiles).toBe('function')
  })

  it('calls the upload/files endpoint', async () => {
    mockFetch(true, [])
    const { fetchMediaFiles } = useMedia()
    await fetchMediaFiles()
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/upload/files'),
      expect.any(Object)
    )
  })

  it('appends image mime filter for type=image', async () => {
    mockFetch(true, [])
    const { fetchMediaFiles } = useMedia()
    await fetchMediaFiles(1, 20, '', 'image')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('image')
  })

  it('appends notContains filter for type=file', async () => {
    mockFetch(true, [])
    const { fetchMediaFiles } = useMedia()
    await fetchMediaFiles(1, 20, '', 'file')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('notContains')
  })

  it('does not append mime filter for type=all', async () => {
    mockFetch(true, [])
    const { fetchMediaFiles } = useMedia()
    await fetchMediaFiles(1, 20, '', 'all')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).not.toContain('mime')
  })

  it('appends name search filter when search is provided', async () => {
    mockFetch(true, [])
    const { fetchMediaFiles } = useMedia()
    await fetchMediaFiles(1, 20, 'report')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('report')
  })

  it('handles array response directly (no data wrapper)', async () => {
    const files = [{ id: 1, url: '/img.png' }, { id: 2, url: '/doc.pdf' }]
    mockFetch(true, files)
    const { fetchMediaFiles } = useMedia()
    const result = await fetchMediaFiles()
    expect(result.files).toEqual(files)
    expect(result.total).toBe(files.length)
    expect(result.hasMore).toBe(false)
  })

  it('handles paginated response with results wrapper', async () => {
    const files = [{ id: 1 }, { id: 2 }]
    const paginatedResponse = {
      results: files,
      pagination: { total: 50, pageCount: 3 },
    }
    mockFetch(true, paginatedResponse)
    const { fetchMediaFiles } = useMedia()
    const result = await fetchMediaFiles(1, 20)
    expect(result.files).toEqual(files)
    expect(result.total).toBe(50)
    expect(result.hasMore).toBe(true)
  })

  it('hasMore is false when on the last page', async () => {
    const paginatedResponse = {
      results: [{ id: 1 }],
      pagination: { total: 5, pageCount: 1 },
    }
    mockFetch(true, paginatedResponse)
    const { fetchMediaFiles } = useMedia()
    const result = await fetchMediaFiles(1, 20)
    expect(result.hasMore).toBe(false)
  })

  it('throws when response is not ok', async () => {
    mockFetch(false)
    const { fetchMediaFiles } = useMedia()
    await expect(fetchMediaFiles()).rejects.toThrow('Failed to fetch media')
  })

  it('includes pagination params in URL', async () => {
    mockFetch(true, [])
    const { fetchMediaFiles } = useMedia()
    await fetchMediaFiles(2, 15)
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('pagination%5Bpage%5D=2')
    expect(url).toContain('pagination%5BpageSize%5D=15')
  })
})
