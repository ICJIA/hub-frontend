<template>
  <div class="max-w-[1400px] mx-auto px-4 py-6">
    <div class="text-center mb-6">
      <div class="flex justify-center gap-1 mb-3">
        <UButton variant="ghost" to="/" size="sm">Articles</UButton>
        <UButton variant="ghost" to="/apps" size="sm">Apps</UButton>
        <UButton variant="ghost" to="/datasets" size="sm">Datasets</UButton>
      </div>
      <h1 class="text-2xl font-bold">Research Articles</h1>
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
        <USelect
          v-model="filterAuthor"
          :items="[{ label: 'All Authors', value: null }, ...availableAuthors.map(a => ({ label: a, value: a }))]"
          size="sm"
          class="w-40"
          @update:model-value="onFilterChange"
        />
        <USelect
          v-model="filterYear"
          :items="[{ label: 'All Years', value: null }, ...availableYears.map(y => ({ label: y, value: y }))]"
          size="sm"
          class="w-28"
          @update:model-value="onFilterChange"
        />
        <div class="flex-1 min-w-[180px]">
          <UInput
            v-model="searchQuery"
            placeholder="Search..."
            icon="i-heroicons-magnifying-glass"
            size="sm"
            @input="onSearchInput"
          />
        </div>
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
      <p class="mt-4 text-gray-500">Loading articles...</p>
    </div>

    <div v-else-if="articles.length > 0" class="grid grid-cols-12 gap-4">
      <div
        v-for="article in articles"
        :key="article.documentId"
        :class="viewMode === 'list' ? 'col-span-12' : 'col-span-12 sm:col-span-6 md:col-span-4'"
      >
        <div
          @click="goToArticle(article.documentId)"
          class="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow h-full"
          :class="viewMode === 'list' ? 'flex' : ''"
        >
          <img
            v-if="article.Splash?.url"
            :src="API_BASE_URL + article.Splash.url"
            :alt="article.Title"
            :class="viewMode === 'list' ? 'w-44 min-w-[180px] object-cover' : 'w-full h-48 object-cover'"
          />
          <div
            v-else
            class="flex items-center justify-center bg-purple-300"
            :style="viewMode === 'list' ? 'width:180px;min-width:180px' : 'height:200px'"
          >
            <span class="text-white text-sm">No Image</span>
          </div>
          <div class="p-4">
            <div class="text-lg font-semibold mb-1 leading-snug">{{ article.Title }}</div>
            <div v-if="article.Date" class="text-xs text-gray-500 mb-2">{{ formatDate(article.Date) }}</div>
            <p v-if="article.Abstract" class="text-sm text-gray-500 mb-3">{{ truncate(article.Abstract, 150) }}</p>
            <div v-if="article.Categories?.length" class="flex flex-wrap gap-1">
              <UBadge
                v-for="category in article.Categories"
                :key="category"
                color="primary"
                variant="subtle"
                size="sm"
              >{{ category }}</UBadge>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="text-center py-16 text-gray-500">
      <p>No articles found.</p>
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
import { fetchArticles, API_BASE_URL } from '~/services/api'

const router = useRouter()

const articles = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const filterTopic = ref(null)
const filterAuthor = ref(null)
const filterYear = ref(null)
const viewMode = ref('grid')
const availableTopics = ref([])
const availableAuthors = ref([])
const availableYears = ref([])
let searchTimeout = null

const pagination = reactive({
  page: 1,
  pageSize: 12,
  pageCount: 1,
  total: 0
})

const loadArticles = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await fetchArticles(
      pagination.page,
      pagination.pageSize,
      'Date:desc',
      searchQuery.value,
      { category: filterTopic.value || '', author: filterAuthor.value || '', year: filterYear.value || '' }
    )
    articles.value = data.data
    pagination.page = data.meta.pagination.page
    pagination.pageCount = data.meta.pagination.pageCount
    pagination.total = data.meta.pagination.total
  } catch (err) {
    error.value = `Failed to load articles: ${err.message}`
    articles.value = []
  } finally {
    loading.value = false
  }
}

const loadFilterOptions = async () => {
  try {
    const data = await fetchArticles(1, 100, 'Date:desc', '', {})
    const topics = new Set()
    const authorsMap = new Map()
    const years = new Set()
    data.data.forEach(item => {
      if (Array.isArray(item.Categories)) item.Categories.forEach(c => { if (c) topics.add(c) })
      if (Array.isArray(item.Authors)) {
        item.Authors.forEach(a => {
          const name = (typeof a === 'string' ? a : (a?.title || a?.name || a?.Name))?.trim()
          if (name && !authorsMap.has(name.toLowerCase())) {
            authorsMap.set(name.toLowerCase(), name)
          }
        })
      }
      if (item.Date) years.add(String(new Date(item.Date).getFullYear()))
    })
    availableTopics.value = [...topics].sort()
    availableAuthors.value = [...authorsMap.values()].sort()
    availableYears.value = [...years].sort((a, b) => b - a)
  } catch (_) { /* filter options are non-critical */ }
}

const onSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    loadArticles()
  }, 300)
}

const onFilterChange = () => {
  pagination.page = 1
  loadArticles()
}

const changePage = async (page) => {
  pagination.page = page
  await loadArticles()
}

const goToArticle = (id) => {
  router.push(`/article/${id}`)
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
  loadArticles()
  loadFilterOptions()
})
</script>
