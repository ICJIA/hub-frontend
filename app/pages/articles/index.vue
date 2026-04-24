<template>
  <div class="max-w-[1400px] mx-auto px-4 py-6">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold">Research Articles</h1>
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
      <p class="mt-4 text-gray-500">Loading articles...</p>
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
            :image-url="item.imageUrl || null"
            :view-mode="viewMode"
            @click="goToArticle(item.slug)"
          />
        </div>
      </div>

      <div v-else class="text-center py-16 text-gray-500">
        <p>No articles found.</p>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { loadIndex, searchByType, getByType, isLoaded, isLoading, loadError } = useSearch()

// Initialize from URL so topic clicks from Research Hub and shared links work
const filterTopic = ref(route.query.topic || null)
const filterAuthor = ref(route.query.author || null)
const filterYear = ref(route.query.year || null)
const filterSearch = ref(route.query.search || '')
const viewMode = ref('grid')
const currentPage = ref(Number(route.query.page) || 1)
const pageSize = 12

const allItems = computed(() => getByType('article'))

const availableTopics = computed(() =>
  [...new Set(allItems.value.flatMap(i => i.categories))].filter(Boolean).sort()
)

const availableAuthors = computed(() =>
  [...new Set(allItems.value.flatMap(i => i.authors))].filter(Boolean).sort()
)

const availableYears = computed(() => {
  const years = new Set(
    allItems.value
      .map(i => {
        const y = new Date(i.date).getFullYear()
        return Number.isFinite(y) ? String(y) : null
      })
      .filter(Boolean)
  )
  return [...years].sort((a, b) => Number(b) - Number(a))
})

const searchResults = computed(() => searchByType(filterSearch.value, 'article'))

const filteredItems = computed(() =>
  searchResults.value.filter(item => {
    if (filterTopic.value && !item.categories.includes(filterTopic.value)) return false
    if (filterAuthor.value && !item.authors.includes(filterAuthor.value)) return false
    if (filterYear.value && String(new Date(item.date).getFullYear()) !== filterYear.value) return false
    return true
  })
)

const totalFiltered = computed(() => filteredItems.value.length)

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
})

// Reset to page 1 when any filter changes
watch([filterSearch, filterTopic, filterAuthor, filterYear], () => {
  currentPage.value = 1
})

// Sync filters → URL so filtered views are shareable / deep-linkable
watch([filterTopic, filterAuthor, filterYear, filterSearch, currentPage], () => {
  const query = {}
  if (filterTopic.value) query.topic = filterTopic.value
  if (filterAuthor.value) query.author = filterAuthor.value
  if (filterYear.value) query.year = filterYear.value
  if (filterSearch.value) query.search = filterSearch.value
  if (currentPage.value > 1) query.page = String(currentPage.value)
  router.replace({ query })
})

// Sync URL → filters for back/forward navigation and external links
watch(() => route.query, (q) => {
  if ((q.topic || null) !== filterTopic.value) filterTopic.value = q.topic || null
  if ((q.author || null) !== filterAuthor.value) filterAuthor.value = q.author || null
  if ((q.year || null) !== filterYear.value) filterYear.value = q.year || null
  if ((q.search || '') !== filterSearch.value) filterSearch.value = q.search || ''
  const p = Number(q.page || 1)
  if (p !== currentPage.value) currentPage.value = p
})

const changePage = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToArticle = (slug) => router.push(`/articles/${slug}`)

onMounted(async () => {
  await loadIndex()
})
</script>
