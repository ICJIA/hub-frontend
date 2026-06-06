import { describe, it, expect, vi } from 'vitest'
import { useDatasets } from '../../../app/composables/useDatasets.js'

const mockFetch = (ok = true, data: unknown = {}) => {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    status: ok ? 200 : 500,
    json: vi.fn().mockResolvedValueOnce(data),
  } as unknown as Response)
}

describe('useDatasets – fetchDatasets', () => {
  it('returns a fetchDatasets function', () => {
    const { fetchDatasets } = useDatasets()
    expect(typeof fetchDatasets).toBe('function')
  })

  it('calls the correct API endpoint', async () => {
    mockFetch(true, { data: [] })
    const { fetchDatasets } = useDatasets()
    await fetchDatasets()
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/api/datasets'),
      expect.any(Object)
    )
  })

  it('includes pagination page parameter', async () => {
    mockFetch(true, { data: [] })
    const { fetchDatasets } = useDatasets()
    await fetchDatasets(4)
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('pagination%5Bpage%5D=4')
  })

  it('includes pagination pageSize parameter', async () => {
    mockFetch(true, { data: [] })
    const { fetchDatasets } = useDatasets()
    await fetchDatasets(1, 30)
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('pagination%5BpageSize%5D=30')
  })

  it('appends search filter when search is provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchDatasets } = useDatasets()
    await fetchDatasets(1, 10, 'date:desc', 'arrest')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('filters')
  })

  it('does not append search filter for empty search', async () => {
    mockFetch(true, { data: [] })
    const { fetchDatasets } = useDatasets()
    await fetchDatasets(1, 10, 'date:desc', '')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).not.toContain('%24or')
  })

  it('appends category filter when provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchDatasets } = useDatasets()
    await fetchDatasets(1, 10, 'date:desc', '', { category: 'Crime' })
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('categories')
  })

  it('appends year filter with gte and lte bounds', async () => {
    mockFetch(true, { data: [] })
    const { fetchDatasets } = useDatasets()
    await fetchDatasets(1, 10, 'date:desc', '', { year: '2021' })
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('2021-01-01')
    expect(url).toContain('2021-12-31')
  })

  it('throws HTTP error when response is not ok', async () => {
    mockFetch(false)
    const { fetchDatasets } = useDatasets()
    await expect(fetchDatasets()).rejects.toThrow('HTTP error! status: 500')
  })

  it('returns parsed JSON', async () => {
    const payload = { data: [{ id: 1 }], meta: {} }
    mockFetch(true, payload)
    const { fetchDatasets } = useDatasets()
    const result = await fetchDatasets()
    expect(result).toEqual(payload)
  })
})

describe('useDatasets – fetchDatasetById', () => {
  it('calls fetch with dataset ID in URL', async () => {
    mockFetch(true, { data: { id: 10 } })
    const { fetchDatasetById } = useDatasets()
    await fetchDatasetById(10)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('/api/datasets/10'),
      expect.any(Object)
    )
  })

  it('returns data property from response', async () => {
    const dataset = { id: 10, title: 'Arrest Data' }
    mockFetch(true, { data: dataset })
    const { fetchDatasetById } = useDatasets()
    const result = await fetchDatasetById(10)
    expect(result).toEqual(dataset)
  })

  it('throws "Dataset not found" when data is missing', async () => {
    mockFetch(true, {})
    const { fetchDatasetById } = useDatasets()
    await expect(fetchDatasetById(99)).rejects.toThrow('Dataset not found')
  })

  it('throws HTTP error when response is not ok', async () => {
    mockFetch(false)
    const { fetchDatasetById } = useDatasets()
    await expect(fetchDatasetById(1)).rejects.toThrow('HTTP error!')
  })
})

describe('useDatasets – fetchDatasetBySlug', () => {
  it('calls fetch with slug filter in URL', async () => {
    mockFetch(true, { data: [{ id: 1, slug: 'arrests-2023' }] })
    const { fetchDatasetBySlug } = useDatasets()
    await fetchDatasetBySlug('arrests-2023')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('arrests-2023')
  })

  it('returns the first dataset from data array', async () => {
    const dataset = { id: 5, slug: 'crime-stats' }
    mockFetch(true, { data: [dataset] })
    const { fetchDatasetBySlug } = useDatasets()
    const result = await fetchDatasetBySlug('crime-stats')
    expect(result).toEqual(dataset)
  })

  it('throws "Dataset not found" when data array is empty', async () => {
    mockFetch(true, { data: [] })
    const { fetchDatasetBySlug } = useDatasets()
    await expect(fetchDatasetBySlug('missing')).rejects.toThrow('Dataset not found')
  })

  it('throws HTTP error when not ok', async () => {
    mockFetch(false)
    const { fetchDatasetBySlug } = useDatasets()
    await expect(fetchDatasetBySlug('slug')).rejects.toThrow('HTTP error!')
  })
})

describe('useDatasets – updateDataset', () => {
  it('uses PUT method', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateDataset } = useDatasets()
    await updateDataset(1, { title: 'Updated' })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(opts.method).toBe('PUT')
  })

  it('sends JSON body with data wrapper', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateDataset } = useDatasets()
    await updateDataset(1, { title: 'Test' })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body).toHaveProperty('data')
  })

  it('normalizes datafile array to array of IDs', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateDataset } = useDatasets()
    await updateDataset(1, { datafile: [{ id: 5 }, { id: 10 }] })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body.data.datafile).toEqual([5, 10])
  })

  it('normalizes datafile as object-with-id to array', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateDataset } = useDatasets()
    await updateDataset(1, { datafile: { id: 8, name: 'data.csv' } })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body.data.datafile).toEqual([8])
  })

  it('normalizes datafile as null to empty array', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateDataset } = useDatasets()
    await updateDataset(1, { datafile: null })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body.data.datafile).toEqual([])
  })

  it('normalizes apps array to IDs', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateDataset } = useDatasets()
    await updateDataset(1, { apps: [{ id: 3 }, { id: 7 }] })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body.data.apps).toEqual([3, 7])
  })

  it('normalizes articles array to IDs', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { updateDataset } = useDatasets()
    await updateDataset(1, { articles: [{ id: 11 }] })
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    const body = JSON.parse(opts.body as string)
    expect(body.data.articles).toEqual([11])
  })

  it('throws with error message when response includes error detail', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: vi.fn().mockResolvedValueOnce({ error: { message: 'Invalid data' } }),
    } as unknown as Response)
    const { updateDataset } = useDatasets()
    await expect(updateDataset(1, {})).rejects.toThrow('Invalid data')
  })
})

describe('useDatasets – publishDataset', () => {
  it('uses PUT method', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { publishDataset } = useDatasets()
    await publishDataset(1)
    const opts = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(opts.method).toBe('PUT')
  })

  it('includes status=published in URL', async () => {
    mockFetch(true, { data: { id: 1 } })
    const { publishDataset } = useDatasets()
    await publishDataset(1)
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('status=published')
  })

  it('throws when response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValueOnce({}),
    } as unknown as Response)
    const { publishDataset } = useDatasets()
    await expect(publishDataset(1)).rejects.toThrow()
  })
})

describe('useDatasets – fetchDatasetsBasic', () => {
  it('returns data array on success', async () => {
    const list = [{ id: 1, title: 'Dataset A' }]
    mockFetch(true, { data: list })
    const { fetchDatasetsBasic } = useDatasets()
    const result = await fetchDatasetsBasic()
    expect(result).toEqual(list)
  })

  it('returns empty array when data is missing', async () => {
    mockFetch(true, {})
    const { fetchDatasetsBasic } = useDatasets()
    const result = await fetchDatasetsBasic()
    expect(result).toEqual([])
  })

  it('appends title search filter when search is provided', async () => {
    mockFetch(true, { data: [] })
    const { fetchDatasetsBasic } = useDatasets()
    await fetchDatasetsBasic('arrests')
    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('arrests')
  })

  it('throws HTTP error when response is not ok', async () => {
    mockFetch(false)
    const { fetchDatasetsBasic } = useDatasets()
    await expect(fetchDatasetsBasic()).rejects.toThrow('HTTP error!')
  })
})
