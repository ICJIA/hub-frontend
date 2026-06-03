<template>
  <div class="max-w-[1400px] mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-4">Search</h1>

      <div class="relative w-full max-w-2xl">
        <UInput
          ref="inputEl"
          v-model="query"
          size="lg"
          placeholder="Search articles, apps, datasets, and files…"
          icon="i-lucide-search"
          class="w-full"
          @keydown.escape="query = ''"
        />
        <button
          v-if="query"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Clear search"
          @mousedown.prevent="query = ''"
        >
          <UIcon name="i-lucide-x" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Index not available (no build yet, or build error) -->
    <UAlert
      v-if="loadError"
      color="warning"
      icon="i-lucide-triangle-alert"
      :description="loadError"
      class="max-w-2xl mb-6"
    />

    <!-- Loading indicator -->
    <div v-else-if="isLoading" class="flex items-center gap-3 py-8 text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
      <span>Loading search index…</span>
    </div>

    <!-- Empty query prompt -->
    <div v-else-if="!query.trim() && isLoaded" class="py-12 text-center text-gray-500">
      <UIcon name="i-lucide-search" class="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p>Enter a search term above to find articles, apps, datasets, and files.</p>
    </div>

    <!-- No results -->
    <div v-else-if="query.trim() && results.length === 0 && isLoaded && !isSearching" class="py-12 text-center text-gray-500">
      <UIcon name="i-lucide-search-x" class="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p>No results for <strong>{{ query }}</strong>.</p>
    </div>

    <!-- Results -->
    <template v-else-if="results.length">
      <p class="text-sm text-gray-500 mb-4">
        {{ results.length }} result{{ results.length !== 1 ? 's' : '' }} for
        <strong>{{ query }}</strong>
      </p>

      <div v-for="group in groupedResults" :key="group.type" class="mb-8">
        <h2 class="text-lg font-semibold capitalize mb-3 flex items-center gap-2">
          <UIcon :name="typeIcon(group.type)" class="w-5 h-5" />
          {{ typeLabel(group.type) }}
          <UBadge color="neutral" variant="subtle" size="sm">{{ group.items.length }}</UBadge>
        </h2>

        <div class="grid grid-cols-12 gap-4">
          <div
            v-for="result in group.items"
            :key="`${result.type}-${result.slug || result.fileUrl || result.url}`"
            class="col-span-12 sm:col-span-6 md:col-span-4"
          >
            <div
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-full cursor-pointer hover:shadow-md transition-shadow"
              @click="navigate(result)"
            >
              <!-- File result card -->
              <template v-if="result.type === 'file'">
                <div class="flex items-start gap-2 mb-2">
                  <UIcon
                    :name="result.fileType === 'pdf' ? 'i-lucide-file-text' : 'i-lucide-table-2'"
                    class="w-5 h-5 mt-0.5 shrink-0 text-gray-400"
                  />
                  <div class="text-base font-semibold leading-snug text-gray-900 dark:text-gray-100 break-all flex-1 min-w-0">
                    {{ result.fileName || result.url.split('/').pop() }}
                  </div>
                  <a
                    v-if="result.fileType === 'pdf' && result.fileUrl"
                    :href="nativePdfUrl(result.fileUrl)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="shrink-0 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    title="Open in browser PDF viewer"
                    aria-label="Open PDF in browser viewer (new tab)"
                    @click.stop
                  >
                    <UIcon name="i-lucide-external-link" class="w-4 h-4" />
                  </a>
                </div>
                <UBadge
                  :color="result.fileType === 'pdf' ? 'error' : 'success'"
                  variant="subtle"
                  size="sm"
                  class="mb-2"
                >
                  {{ result.fileType?.toUpperCase() }}
                </UBadge>
                <p
                  v-if="result.excerpt"
                  class="text-sm text-gray-500 dark:text-gray-400 [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-700 [&_mark]:rounded-sm [&_mark]:text-inherit [&_mark]:not-italic"
                  v-html="result.excerpt"
                />
                <div
                  v-if="result.parents?.length"
                  class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400"
                >
                  <span class="font-medium">Found in:</span>
                  <a
                    v-for="(parent, i) in result.parents"
                    :key="`${parent.type}-${parent.slug}`"
                    :href="parent.url"
                    class="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                    @click.stop
                  >
                    {{ parent.title }}<span v-if="i < result.parents.length - 1">,</span>
                  </a>
                </div>
              </template>

              <!-- Article / app / dataset result card -->
              <template v-else>
                <div class="text-base font-semibold mb-1 leading-snug text-gray-900 dark:text-gray-100">
                  {{ result.item?.title ?? result.slug }}
                </div>
                <div v-if="result.item?.date" class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {{ formatDate(result.item.date) }}
                </div>

                <!-- Pagefind excerpt with native <mark> highlighting -->
                <p
                  v-if="result.excerpt"
                  class="text-sm text-gray-500 dark:text-gray-400 mb-3 [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-700 [&_mark]:rounded-sm [&_mark]:text-inherit [&_mark]:not-italic"
                  v-html="result.excerpt"
                />
                <p v-else-if="result.item?.summary" class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {{ truncate(result.item.summary, 150) }}
                </p>

                <div v-if="result.item?.categories?.length" class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="cat in result.item.categories"
                    :key="cat"
                    color="primary"
                    variant="subtle"
                    size="sm"
                  >{{ cat }}</UBadge>
                </div>

                <!-- Attached files: show ALL files on the article/dataset, and
                     mark the ones whose contents also matched the query. -->
                <div
                  v-if="result.item?.files?.length"
                  class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
                >
                  <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Attached file{{ result.item.files.length !== 1 ? 's' : '' }}
                    ({{ result.item.files.length }}<template v-if="result.attachedFiles?.length">, {{ result.attachedFiles.length }} contain{{ result.attachedFiles.length === 1 ? 's' : '' }} match</template>):
                  </div>
                  <ul class="space-y-2">
                    <li
                      v-for="file in result.item.files"
                      :key="file.hash"
                      class="flex items-start gap-2 text-sm"
                    >
                      <UIcon
                        :name="fileIcon(file.fileType)"
                        class="w-4 h-4 mt-0.5 shrink-0"
                        :class="matchForFile(result, file.hash) ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400'"
                      />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <a
                            href="#"
                            class="text-blue-600 dark:text-blue-400 hover:underline break-all"
                            :class="matchForFile(result, file.hash) ? 'font-semibold' : ''"
                            @click.stop.prevent="navigateFile(file)"
                          >
                            {{ file.name }}
                          </a>
                          <UBadge
                            v-if="matchForFile(result, file.hash)"
                            color="warning"
                            variant="subtle"
                            size="xs"
                          >
                            contains match
                          </UBadge>
                        </div>
                        <p
                          v-if="matchForFile(result, file.hash)?.excerpt"
                          class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-700 [&_mark]:rounded-sm [&_mark]:text-inherit [&_mark]:not-italic"
                          v-html="matchForFile(result, file.hash).excerpt"
                        />
                      </div>
                    </li>
                  </ul>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineRouteRules({ prerender: true })

import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const { load, search, isLoaded, isLoading, loadError } = usePagefind()

useSeoMeta({
  title: 'Search | ICJIA Research Hub',
  description: 'Search criminal justice research, datasets, and apps from the ICJIA Research and Analysis Unit.',
  ogTitle: 'Search | ICJIA Research Hub',
  ogDescription: 'Search criminal justice research, datasets, and apps from the ICJIA Research and Analysis Unit.'
})

const query = ref(route.query.q ? String(route.query.q) : '')

// Keep query in sync with back/forward navigation and direct URL edits
watch(() => route.query.q, (q) => {
  const next = q ? String(q) : ''
  if (next !== query.value) query.value = next
})

// Load the pagefind index once on mount (client-only)
useAsyncData('search-index', () => load(), { server: false })

const results = ref([])
const isSearching = ref(false)

const runSearch = async (q) => {
  const trimmed = q.trim()
  if (!trimmed) { results.value = []; return }

  isSearching.value = true
  try {
    results.value = await search(trimmed)
  } finally {
    isSearching.value = false
  }
}

// Re-run when the query changes or when the index finishes loading
watch([query, isLoaded], ([q]) => runSearch(q), { immediate: true })

// Sync query → URL so searches are bookmarkable
watch(query, (val) => {
  const trimmed = val.trim()
  router.replace({ query: trimmed ? { q: trimmed } : {} })
})

// Group results and attach file hits under their parent article/dataset when
// that parent also appears in the result set. Orphan file hits (parent not
// matched) stay in the standalone Files section.
const groupedResults = computed(() => {
  const groups = { article: [], app: [], dataset: [], file: [] }
  const attachedFiles = new Map() // `${type}:${slug}` → file results

  // Pass 1: index parent matches and collect attachments
  const parentKeys = new Set()
  for (const r of results.value) {
    if (r.type === 'article' || r.type === 'dataset') {
      parentKeys.add(`${r.type}:${r.slug}`)
    }
  }

  // Pass 2: bucket each result; attach files when a parent matched
  for (const r of results.value) {
    if (r.type === 'file' && r.parents?.length) {
      const attachKey = r.parents
        .map(p => `${p.type}:${p.slug}`)
        .find(k => parentKeys.has(k))
      if (attachKey) {
        if (!attachedFiles.has(attachKey)) attachedFiles.set(attachKey, [])
        attachedFiles.get(attachKey).push(r)
        continue
      }
    }
    if (r.type in groups) groups[r.type].push(r)
  }

  // Decorate parent items with their attached files
  for (const type of ['article', 'dataset']) {
    groups[type] = groups[type].map(r => ({
      ...r,
      attachedFiles: attachedFiles.get(`${type}:${r.slug}`) ?? []
    }))
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([type, items]) => ({ type, items }))
})

const typeLabel = (type) => {
  const map = { article: 'Articles', app: 'Apps', dataset: 'Datasets', file: 'Files' }
  return map[type] ?? type
}

const typeIcon = (type) => {
  const map = {
    article: 'i-lucide-file-text',
    app: 'i-lucide-layout-dashboard',
    dataset: 'i-lucide-database',
    file: 'i-lucide-paperclip'
  }
  return map[type] ?? 'i-lucide-file'
}

const navigate = (result) => {
  if (result.type === 'file') {
    if (result.fileType === 'pdf') {
      // Open in the PDF viewer page with the current search query for highlighting
      router.push({
        path: '/pdf-viewer',
        query: {
          file: result.fileUrl,
          ...(query.value.trim() ? { q: query.value.trim() } : {})
        }
      })
    } else {
      // Excel / CSV — trigger a download in a new tab
      window.open(result.fileUrl, '_blank', 'noopener,noreferrer')
    }
    return
  }
  router.push(result.url)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const truncate = (text, len) => (text?.length > len ? text.slice(0, len) + '…' : text ?? '')

// Append `#search=<query>` to PDF URLs so Chromium's native viewer highlights
// the term on open. Strips any pre-existing hash so we don't double-up.
const nativePdfUrl = (url) => {
  const q = query.value.trim()
  const base = url.split('#')[0]
  return q ? `${base}#search=${encodeURIComponent(q)}` : base
}

const fileIcon = (fileType) => {
  if (fileType === 'pdf') return 'i-lucide-file-text'
  if (fileType === 'excel') return 'i-lucide-table-2'
  return 'i-lucide-file'
}

// Look up the matching pagefind file result (if any) for a file attached to
// this parent. Returns the file result so the caller can render the excerpt.
const matchForFile = (parentResult, hash) => {
  if (!parentResult.attachedFiles?.length) return null
  return parentResult.attachedFiles.find((f) => {
    const fileHash = (f.url.split('/').pop() ?? '').replace(/\.(pdf|html)$/i, '')
    return fileHash === hash
  }) ?? null
}

// Drives clicks on inline attached-file links inside a parent card. Uses the
// raw Strapi file URL (so even non-indexed files like .docx are openable).
const navigateFile = (file) => {
  if (file.fileType === 'pdf') {
    router.push({
      path: '/pdf-viewer',
      query: {
        file: file.fileUrl,
        ...(query.value.trim() ? { q: query.value.trim() } : {})
      }
    })
  } else {
    window.open(file.fileUrl, '_blank', 'noopener,noreferrer')
  }
}
</script>
