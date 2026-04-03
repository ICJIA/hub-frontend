<template>
  <div class="max-w-[1400px] mx-auto px-4 py-6">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold">Research Articles</h1>
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
      <p class="mt-4 text-gray-500">Loading articles...</p>
    </div>

    <div v-else-if="articles.length > 0" class="grid grid-cols-12 gap-4">
      <div
        v-for="article in articles"
        :key="article.documentId"
        :class="viewMode === 'list' ? 'col-span-12' : 'col-span-12 sm:col-span-6 md:col-span-4'"
      >
        <ContentCard
          :title="article.title"
          :date="article.date"
          :description="article.abstract"
          :categories="article.categories"
          :image-url="article.splash?.url ? API_BASE_URL + article.splash.url : null"
          :view-mode="viewMode"
          @click="goToArticle(article.slug)"
        />
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

const router = useRouter()
const { fetchArticles } = useArticles()

const articles = ref([])
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

const loadArticles = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await fetchArticles(
      pagination.page,
      pagination.pageSize,
      'date:desc',
      '',
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
    const data = await fetchArticles(1, 100, 'date:desc', '', {})
    const topics = new Set()
    const authorsMap = new Map()
    const years = new Set()
    data.data.forEach(item => {
      if (Array.isArray(item.categories)) item.categories.forEach(c => { if (c) topics.add(c) })
      if (Array.isArray(item.authors)) {
        item.authors.forEach(a => {
          const name = (typeof a === 'string' ? a : (a?.title || a?.name || a?.Name))?.trim()
          if (name && !authorsMap.has(name.toLowerCase())) {
            authorsMap.set(name.toLowerCase(), name)
          }
        })
      }
      if (item.date) years.add(String(new Date(item.date).getFullYear()))
    })
    availableTopics.value = [...topics].sort()
    availableAuthors.value = [...authorsMap.values()].sort()
    availableYears.value = [...years].sort((a, b) => b - a)
  } catch (_) { /* filter options are non-critical */ }
}

const onFilterChange = () => {
  pagination.page = 1
  loadArticles()
}

const changePage = async (page) => {
  pagination.page = page
  await loadArticles()
}

const goToArticle = (slug) => router.push(`/article/${slug}`)

onMounted(() => {
  loadArticles()
  loadFilterOptions()
})
</script>
