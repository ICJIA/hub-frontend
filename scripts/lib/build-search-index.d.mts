export interface SearchIndexItem {
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

export interface BuildIndexResult {
  index: SearchIndexItem[]
  counts: { articles: number; apps: number; datasets: number }
}

export function stripMarkdown(text: string): string

export function fetchAllItems(
  endpoint: string,
  options: { apiBaseUrl: string; headers: Record<string, string> }
): Promise<unknown[]>

export function buildIndex(options: {
  apiBaseUrl: string
  bearerToken: string
}): Promise<BuildIndexResult>
