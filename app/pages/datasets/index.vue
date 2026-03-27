<template>
  <div class="max-w-[1400px] mx-auto px-4 py-6">
    <div class="text-center mb-6">
      <div class="flex justify-center gap-1 mb-3">
        <UButton variant="ghost" to="/" size="sm">Articles</UButton>
        <UButton variant="ghost" to="/apps" size="sm">Apps</UButton>
        <UButton variant="ghost" to="/datasets" size="sm">Datasets</UButton>
      </div>
      <h1 class="text-2xl font-bold">Datasets</h1>
    </div>

    <div class="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-6">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-gray-500 font-medium">Filter by:</span>
        <USelect
          v-model="filterTopic"
          :items="[{ label: 'All Topics', value: null }, ...availableTopics.map(t => ({ label: t, value: t }))]"
          size="sm"
          class="w-40"
          @update:model-value="onFilterChange"
        />
        <USelect placeholder="All Centers" size="sm" class="w-36" disabled />
        <USelect placeholder="All Authors" size="sm" class="w-36" disabled />
        <USelect
          v-model="filterYear"
          :items="[{ label: 'All Years', value: null }, ...availableYears.map(y => ({ label: y, value: y }))]"
          size="sm"
          class="w-28"
          @update:model-value="onFilterChange"
        />
        <!-- <div class="flex-1 min-w-[180px]">
          <UInput
            v-model="searchQuery"
            placeholder="Search..."
            icon="i-heroicons-magnifying-glass"
            size="sm"
            @input="onSearchInput"
          />
        </div> -->
        <div class="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            :class="['px-2 py-1 text-sm', viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50']"
            @click="viewMode = 'grid'"
          >
            <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4" />
          </button>
          <button
            :class="['px-2 py-1 text-sm border-l border-gray-300', viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50']"
            @click="viewMode = 'list'"
          >
            <UIcon name="i-heroicons-list-bullet" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <UAlert v-if="error" color="error" :description="error" class="mb-4" />

    <div v-if="loading" class="flex flex-col items-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
      <p class="mt-4 text-gray-500">Loading datasets...</p>
    </div>

    <div v-else-if="datasets.length > 0" class="grid grid-cols-12 gap-4">
      <div
        v-for="dataset in datasets"
        :key="dataset.documentId"
        :class="viewMode === 'list' ? 'col-span-12' : 'col-span-12 sm:col-span-6 md:col-span-4'"
      >
        <div
          @click="goToDataset(dataset.documentId)"
          class="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow h-full p-4"
        >
          <div class="text-lg font-semibold mb-1 leading-snug">{{ dataset.title }}</div>
          <div v-if="dataset.date" class="text-xs text-gray-500 mb-2">{{ formatDate(dataset.date) }}</div>
          <p v-if="dataset.description" class="text-sm text-gray-500 mb-3">{{ truncate(dataset.description, 150) }}</p>
          <div v-if="dataset.categories?.length" class="flex flex-wrap gap-1">
            <UBadge
              v-for="category in dataset.categories"
              :key="category"
              color="primary"
              variant="subtle"
              size="sm"
            >{{ category }}</UBadge>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-16 text-gray-500">
      <p>No datasets found.</p>
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
import { fetchDatasets } from '~/services/api'

const router = useRouter()

const datasets = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const filterTopic = ref(null)
const filterYear = ref(null)
const viewMode = ref('grid')
const availableTopics = ref([])
const availableYears = ref([])
let searchTimeout = null

const pagination = reactive({
  page: 1,
  pageSize: 12,
  pageCount: 1,
  total: 0
})

const loadDatasets = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await fetchDatasets(
      pagination.page,
      pagination.pageSize,
      'date:desc',
      searchQuery.value,
      { category: filterTopic.value || '', year: filterYear.value || '' }
    )
    datasets.value = data.data
    pagination.page = data.meta.pagination.page
    pagination.pageCount = data.meta.pagination.pageCount
    pagination.total = data.meta.pagination.total
  } catch (err) {
    error.value = `Failed to load datasets: ${err.message}`
    datasets.value = []
  } finally {
    loading.value = false
  }
}

const loadFilterOptions = async () => {
  try {
    const data = await fetchDatasets(1, 100, 'date:desc', '', {})
    const topics = new Set()
    const years = new Set()
    data.data.forEach(item => {
      if (Array.isArray(item.categories)) item.categories.forEach(c => { if (c) topics.add(c) })
      if (item.date) years.add(String(new Date(item.date).getFullYear()))
    })
    availableTopics.value = [...topics].sort()
    availableYears.value = [...years].sort((a, b) => b - a)
  } catch (_) { /* filter options are non-critical */ }
}

const onSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    loadDatasets()
  }, 300)
}

const onFilterChange = () => {
  pagination.page = 1
  loadDatasets()
}

const changePage = async (page) => {
  pagination.page = page
  await loadDatasets()
}

const goToDataset = (id) => {
  router.push(`/datasets/${id}`)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

const truncate = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

onMounted(() => {
  loadDatasets()
  loadFilterOptions()
})
</script>
