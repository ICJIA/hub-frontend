export interface AttachedFile {
  hash: string
  name: string
  ext: string
  fileType: 'pdf' | 'excel' | 'other'
  fileUrl: string
  indexedUrl: string | null
}

export interface SearchIndexItem {
  id: number
  type: 'article' | 'app' | 'dataset' | 'project' | 'projecthome'
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

export interface FileParent {
  type: 'article' | 'dataset'
  slug: string
  title: string
  url: string
}

export interface BuildIndexResult {
  index: SearchIndexItem[]
  fileParents: Record<string, FileParent[]>
  counts: { articles: number; apps: number; datasets: number; projects: number; projecthomes: number }
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
