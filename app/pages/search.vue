<template>
  <div class="max-w-[1400px] mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-4">Search</h1>

      <UInput
        ref="inputEl"
        v-model="query"
        size="lg"
        placeholder="Search articles, apps, datasets, and files…"
        icon="i-lucide-search"
        :trailing-icon="query ? 'i-lucide-x' : undefined"
        class="w-full max-w-2xl"
        @keydown.escape="query = ''"
        @click:trailing="query = ''"
      />
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
                  <div class="text-base font-semibold leading-snug text-gray-900 dark:text-gray-100 break-all">
                    {{ result.fileName || result.url.split('/').pop() }}
                  </div>
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

const groupedResults = computed(() => {
  const groups = { article: [], app: [], dataset: [], file: [] }
  for (const result of results.value) {
    if (result.type in groups) {
      groups[result.type].push(result)
    }
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
</script>
