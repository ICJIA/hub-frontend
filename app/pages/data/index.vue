<template>
  <div class="max-w-[1400px] mx-auto px-4 py-6">
    <div class="flex items-center gap-2 mb-4">
      <button
        :class="activeTab === 'datasets'
          ? 'bg-primary-600 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
        class="px-5 py-2 rounded-full text-sm font-semibold transition-colors"
        @click="setTab('datasets')"
      >
        Datasets
      </button>
      <button
        :class="activeTab === 'apps'
          ? 'bg-primary-600 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'"
        class="px-5 py-2 rounded-full text-sm font-semibold transition-colors"
        @click="setTab('apps')"
      >
        Apps
      </button>
    </div>

    <ContentFilterBar
      v-model:topic="filterTopic"
      v-model:author="filterAuthor"
      v-model:year="filterYear"
      v-model:search="filterSearch"
      v-model:view-mode="viewMode"
      :available-topics="availableTopics"
      :available-authors="availableAuthors"
      :available-years="availableYears"
      :show-author-filter="activeTab === 'apps'"
    />

    <UAlert
      v-if="loadError"
      color="warning"
      icon="i-lucide-triangle-alert"
      :description="loadError"
      class="mb-4"
    />

    <div v-else-if="isLoading" class="flex flex-col items-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
      <p class="mt-4 text-gray-500">Loading {{ activeTab }}...</p>
    </div>

    <template v-else>
      <div v-if="paginatedItems.length > 0" class="grid grid-cols-12 gap-4">
        <div
          v-for="item in paginatedItems"
          :key="item.slug"
          :class="viewMode === 'list' ? 'col-span-12' : 'col-span-12 sm:col-span-6 md:col-span-4'"
        >
          <ContentCard
            :title="item.title"
            :date="item.date"
            :description="item.summary"
            :categories="item.categories"
            :image-url="activeTab === 'apps' ? (item.imageUrl || null) : undefined"
            :show-placeholder="activeTab === 'apps'"
            :view-mode="viewMode"
            :query="filterSearch || undefined"
            @click="goToItem(item.slug)"
          />
        </div>
      </div>

      <div v-else class="text-center py-16 text-gray-500">
        <p>No {{ activeTab }} found.</p>
      </div>

      <div v-if="totalFiltered > pageSize" class="flex justify-center mt-6">
        <UPagination
          :page="currentPage"
          :total="totalFiltered"
          :items-per-page="pageSize"
          @update:page="changePage"
        />
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
const { loadIndex, searchByType, getByType, isLoading, loadError } = useSearch()

const resolvedTab = computed(() =>
  route.query.tab === 'apps' ? 'apps' : 'datasets'
)

useSeoMeta({
  title: computed(() => resolvedTab.value === 'apps' ? 'Apps | ICJIA Research Hub' : 'Datasets | ICJIA Research Hub'),
  description: 'Browse criminal justice datasets and apps from the ICJIA Research and Analysis Unit.',
  ogTitle: computed(() => resolvedTab.value === 'apps' ? 'Apps | ICJIA Research Hub' : 'Datasets | ICJIA Research Hub'),
  ogDescription: 'Browse criminal justice datasets and apps from the ICJIA Research and Analysis Unit.',
})

const activeTab = computed(() => resolvedTab.value)

const filterTopic = ref(null)
const filterAuthor = ref(null)
const filterYear = ref(null)
const filterSearch = ref('')
const viewMode = ref('grid')
const currentPage = ref(1)
const pageSize = 12

const setTab = (tab) => {
  if (activeTab.value === tab) return
  filterTopic.value = null
  filterAuthor.value = null
  filterYear.value = null
  filterSearch.value = ''
  currentPage.value = 1
  router.push({ query: tab === 'datasets' ? {} : { tab } })
}

watch(resolvedTab, () => {
  filterTopic.value = null
  filterAuthor.value = null
  filterYear.value = null
  filterSearch.value = ''
  currentPage.value = 1
})

const contentType = computed(() => activeTab.value === 'datasets' ? 'dataset' : 'app')

const allItems = computed(() => getByType(contentType.value))

const availableTopics = computed(() =>
  [...new Set(allItems.value.flatMap(i => i.categories))].filter(Boolean).sort()
)

const availableAuthors = computed(() =>
  activeTab.value === 'apps'
    ? [...new Set(allItems.value.flatMap(i => i.authors))].filter(Boolean).sort()
    : []
)

const availableYears = computed(() => {
  const years = new Set(
    allItems.value
      .map(i => (i.date ? String(new Date(i.date).getFullYear()) : null))
      .filter(Boolean)
  )
  return [...years].sort((a, b) => Number(b) - Number(a))
})

const searchResults = computed(() => searchByType(filterSearch.value, contentType.value))

const filteredItems = computed(() =>
  searchResults.value.filter(item => {
    if (filterTopic.value && !item.categories.includes(filterTopic.value)) return false
    if (filterAuthor.value && !item.authors?.includes(filterAuthor.value)) return false
    if (filterYear.value && String(new Date(item.date).getFullYear()) !== filterYear.value) return false
    return true
  })
)

const totalFiltered = computed(() => filteredItems.value.length)

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
})

watch([filterSearch, filterTopic, filterAuthor, filterYear], () => {
  currentPage.value = 1
})

const changePage = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToItem = (slug) => {
  const base = activeTab.value === 'datasets' ? '/datasets' : '/apps'
  router.push(`${base}/${slug}`)
}

useAsyncData('search-index', () => loadIndex(), { server: false })
</script>
