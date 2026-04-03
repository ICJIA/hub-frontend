<template>
  <div class="max-w-[1400px] mx-auto px-4 py-6">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold">Apps</h1>
    </div>

    <ContentFilterBar
      v-model:topic="filterTopic"
      v-model:author="filterAuthor"
      v-model:year="filterYear"
      v-model:view-mode="viewMode"
      :available-topics="availableTopics"
      :available-authors="availableAuthors"
      :available-years="availableYears"
      @change="onFilterChange"
    />

    <UAlert v-if="error" color="error" :description="error" class="mb-4" />

    <div v-if="loading" class="flex flex-col items-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
      <p class="mt-4 text-gray-500">Loading apps...</p>
    </div>

    <div v-else-if="apps.length > 0" class="grid grid-cols-12 gap-4">
      <div
        v-for="app in apps"
        :key="app.documentId"
        :class="viewMode === 'list' ? 'col-span-12' : 'col-span-12 sm:col-span-6 md:col-span-4'"
      >
        <ContentCard
          :title="app.title"
          :date="app.date"
          :description="app.description"
          :categories="app.categories"
          :image-url="getAppImageUrl(app)"
          :view-mode="viewMode"
          @click="goToApp(app.slug || app.documentId)"
        />
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-16 text-gray-500">
      <p>No apps found.</p>
    </div>

    <div v-if="pagination.pageCount > 1" class="flex justify-center mt-6">
      <UPagination
        :page="pagination.page"
        :total="pagination.total"
        :items-per-page="pagination.pageSize"
        @update:page="changePage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { fetchApps, getAppImageUrl } = useApps()

const apps = ref([])
const loading = ref(false)
const error = ref(null)
const filterTopic = ref(null)
const filterAuthor = ref(null)
const filterYear = ref(null)
const viewMode = ref('grid')
const availableTopics = ref([])
const availableAuthors = ref([])
const availableYears = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 12,
  pageCount: 1,
  total: 0
})

const loadApps = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await fetchApps(
      pagination.page,
      pagination.pageSize,
      'date:desc',
      '',
      { category: filterTopic.value || '', author: filterAuthor.value || '', year: filterYear.value || '' }
    )
    apps.value = data.data
    pagination.page = data.meta.pagination.page
    pagination.pageCount = data.meta.pagination.pageCount
    pagination.total = data.meta.pagination.total
  } catch (err) {
    error.value = `Failed to load apps: ${err.message}`
    apps.value = []
  } finally {
    loading.value = false
  }
}

const loadFilterOptions = async () => {
  try {
    const data = await fetchApps(1, 100, 'date:desc', '', {})
    const topics = new Set()
    const authors = new Set()
    const years = new Set()
    data.data.forEach(item => {
      if (Array.isArray(item.categories)) item.categories.forEach(c => { if (c) topics.add(c) })
      if (Array.isArray(item.contributors)) {
        item.contributors.forEach(a => {
          const name = typeof a === 'string' ? a : (a?.name || a?.Name)
          if (name) authors.add(name)
        })
      }
      if (item.date) years.add(String(new Date(item.date).getFullYear()))
    })
    availableTopics.value = [...topics].sort()
    availableAuthors.value = [...authors].sort()
    availableYears.value = [...years].sort((a, b) => b - a)
  } catch (_) { /* filter options are non-critical */ }
}

const onFilterChange = () => {
  pagination.page = 1
  loadApps()
}

const changePage = async (page) => {
  pagination.page = page
  await loadApps()
}

const goToApp = (slug) => router.push(`/apps/${slug}`)

onMounted(() => {
  loadApps()
  loadFilterOptions()
})
</script>
