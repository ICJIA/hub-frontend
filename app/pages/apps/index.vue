<template>
  <div class="max-w-[1400px] mx-auto px-4 py-6">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold">Apps</h1>
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
      <p class="mt-4 text-gray-500">Loading apps...</p>
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
            @click="goToApp(item.slug)"
          />
        </div>
      </div>

      <div v-else class="text-center py-16 text-gray-500">
        <p>No apps found.</p>
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
import { useRouter } from 'vue-router'

const router = useRouter()
const { loadIndex, searchByType, getByType, isLoaded, isLoading, loadError } = useSearch()

useSeoMeta({
  title: 'Apps | ICJIA Research Hub',
  description: 'Browse criminal justice apps and tools from the ICJIA Research and Analysis Unit.',
  ogTitle: 'Apps | ICJIA Research Hub',
  ogDescription: 'Browse criminal justice apps and tools from the ICJIA Research and Analysis Unit.',
})

const filterTopic = ref(null)
const filterAuthor = ref(null)
const filterYear = ref(null)
const filterSearch = ref('')
const viewMode = ref('grid')
const currentPage = ref(1)
const pageSize = 12

const allItems = computed(() => getByType('app'))

const availableTopics = computed(() =>
  [...new Set(allItems.value.flatMap(i => i.categories))].filter(Boolean).sort()
)

const availableAuthors = computed(() =>
  [...new Set(allItems.value.flatMap(i => i.authors))].filter(Boolean).sort()
)

const availableYears = computed(() => {
  const years = new Set(
    allItems.value
      .map(i => (i.date ? String(new Date(i.date).getFullYear()) : null))
      .filter(Boolean)
  )
  return [...years].sort((a, b) => Number(b) - Number(a))
})

const searchResults = computed(() => searchByType(filterSearch.value, 'app'))

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

watch([filterSearch, filterTopic, filterAuthor, filterYear], () => {
  currentPage.value = 1
})

const changePage = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToApp = (slug) => router.push(`/apps/${slug}`)

onMounted(async () => {
  await loadIndex()
})
</script>
