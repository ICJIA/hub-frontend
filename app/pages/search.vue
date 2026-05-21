<template>
  <div class="max-w-[1400px] mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-4">Search</h1>

      <UInput
        ref="inputEl"
        v-model="query"
        size="lg"
        placeholder="Search articles, apps, and datasets…"
        icon="i-lucide-search"
        :trailing-icon="query ? 'i-lucide-x' : undefined"
        class="w-full max-w-2xl"
        @keydown.escape="query = ''"
        @click:trailing="query = ''"
      />
    </div>

    <!-- Index not available -->
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
      <p>Enter a search term above to find articles, apps, and datasets.</p>
    </div>

    <!-- No results -->
    <div v-else-if="query.trim() && results.length === 0 && isLoaded" class="py-12 text-center text-gray-500">
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
            v-for="item in group.items"
            :key="`${item.type}-${item.id}`"
            class="col-span-12 sm:col-span-6 md:col-span-4"
          >
            <div
              class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-full cursor-pointer hover:shadow-md transition-shadow"
              @click="navigate(item)"
            >
              <div class="text-base font-semibold mb-1 leading-snug text-gray-900 dark:text-gray-100">
                <HighlightText :text="item.title" :query="query" />
              </div>
              <div v-if="item.date" class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {{ formatDate(item.date) }}
              </div>
              <p v-if="item.summary" class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                <HighlightText :text="truncate(item.summary, 150)" :query="query" />
              </p>
              <div v-if="item.categories?.length" class="flex flex-wrap gap-1">
                <UBadge
                  v-for="cat in item.categories"
                  :key="cat"
                  color="primary"
                  variant="subtle"
                  size="sm"
                >{{ cat }}</UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { loadIndex, search, isLoaded, isLoading, loadError } = useSearch()

useSeoMeta({
  title: 'Search | ICJIA Research Hub',
  description: 'Search criminal justice research, datasets, and apps from the ICJIA Research and Analysis Unit.',
  ogTitle: 'Search | ICJIA Research Hub',
  ogDescription: 'Search criminal justice research, datasets, and apps from the ICJIA Research and Analysis Unit.',
})

const query = ref(route.query.q ? String(route.query.q) : '')

// Keep the input in sync when the user navigates back/forward or edits the URL
watch(() => route.query.q, (q) => {
  const next = q ? String(q) : ''
  if (next !== query.value) query.value = next
})

const results = computed(() => search(query.value))

const groupedResults = computed(() => {
  const groups = { article: [], app: [], dataset: [] }
  for (const item of results.value) {
    groups[item.type]?.push(item)
  }
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([type, items]) => ({ type, items }))
})

const typeLabel = (type) => {
  const map = { article: 'Articles', app: 'Apps', dataset: 'Datasets' }
  return map[type] ?? type
}

const typeIcon = (type) => {
  const map = {
    article: 'i-lucide-file-text',
    app: 'i-lucide-layout-dashboard',
    dataset: 'i-lucide-database'
  }
  return map[type] ?? 'i-lucide-file'
}

const navigate = (item) => {
  const paths = {
    article: `/articles/${item.slug}`,
    app: `/apps/${item.slug}`,
    dataset: `/datasets/${item.slug}`
  }
  router.push(paths[item.type])
}

// Sync query → URL so the search is bookmarkable / shareable.
// Writes the trimmed value so leading/trailing spaces don't pollute shared links.
watch(query, (val) => {
  const trimmed = val.trim()
  router.replace({ query: trimmed ? { q: trimmed } : {} })
})

useAsyncData('search-index', () => loadIndex(), { server: false })
</script>
