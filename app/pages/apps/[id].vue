<template>
  <div class="max-w-[900px] mx-auto px-4 py-6">
    <div v-if="loading" class="flex flex-col items-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
      <p class="mt-4 text-gray-500">Loading app...</p>
    </div>

    <div v-else-if="error" class="text-center py-16">
      <UAlert color="error" :description="error" class="mb-4" />
      <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack">Back to Apps</UButton>
    </div>

    <template v-else-if="app">
      <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack" class="mb-6">
        Back to Apps
      </UButton>

      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="app.title"
        class="w-full rounded-lg mb-6 object-cover max-h-[400px]"
      />

      <div v-if="app.categories?.length" class="flex flex-wrap gap-2 mb-4">
        <UBadge v-for="cat in app.categories" :key="cat" color="primary" variant="subtle">{{ cat }}</UBadge>
      </div>

      <h1 class="text-3xl font-bold mb-3" style="line-height:1.3">{{ app.title }}</h1>

      <div class="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500">
        <span v-if="app.date">{{ formatDate(app.date) }}</span>
        <UBadge v-if="app.external" color="warning" variant="subtle">External</UBadge>
      </div>

      <div v-if="app.contributors?.length" class="flex flex-wrap gap-2 mb-4">
        <UBadge v-for="(c, i) in app.contributors" :key="i" variant="outline">{{ c.title }}</UBadge>
      </div>

      <div v-if="app.tags?.length" class="mb-6">
        <span class="font-bold mr-3 text-sm">Tags:</span>
        <UBadge v-for="tag in app.tags" :key="tag" variant="subtle" class="mr-2 mb-2">{{ tag }}</UBadge>
      </div>

      <div v-if="app.description" class="border border-gray-200 rounded-lg p-5 mb-4">
        <h3 class="text-base font-bold mb-2">Description</h3>
        <p class="text-sm leading-relaxed">{{ app.description }}</p>
      </div>

      <div v-if="app.url" class="border border-gray-200 rounded-lg p-5 mb-4">
        <h3 class="text-base font-bold mb-2">Link</h3>
        <a :href="app.url" target="_blank" rel="noopener noreferrer" class="text-blue-600 break-all">{{ app.url }}</a>
      </div>

      <div v-if="app.funding" class="bg-gray-100 rounded p-4 mb-4">
        <h4 class="text-sm font-bold mb-2">Funding</h4>
        <p class="text-sm leading-relaxed" v-html="app.funding"></p>
      </div>

      <div v-if="app.citation" class="bg-gray-100 rounded p-4 mb-4">
        <h4 class="text-sm font-bold mb-2">Citation</h4>
        <p class="text-sm leading-relaxed" v-html="app.citation"></p>
      </div>

      <template v-if="relatedArticles.length">
        <h3 class="text-base font-bold mb-3">Related Articles</h3>
        <div class="flex flex-wrap gap-2 mb-6">
          <UBadge
            v-for="article in relatedArticles"
            :key="article.documentId || article.id"
            color="primary"
            variant="outline"
            class="cursor-pointer"
            @click="goToArticle(article.documentId)"
          >{{ article.Title || article.title || article.id }}</UBadge>
        </div>
      </template>

      <template v-if="relatedDatasets.length">
        <h3 class="text-base font-bold mb-3">Related Datasets</h3>
        <div class="flex flex-wrap gap-2 mb-6">
          <UBadge
            v-for="dataset in relatedDatasets"
            :key="dataset.documentId || dataset.id"
            color="secondary"
            variant="outline"
            class="cursor-pointer"
            @click="goToDataset(dataset.documentId)"
          >{{ dataset.title || dataset.Title || dataset.id }}</UBadge>
        </div>
      </template>
    </template>

    <button
      v-if="showScrollTop"
      class="fixed bottom-6 right-6 z-10 bg-primary-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors"
      @click="scrollToTop"
      aria-label="Scroll to top"
    >
      <UIcon name="i-heroicons-chevron-up" class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchAppById, API_BASE_URL } from '~/services/api'

const router = useRouter()
const route = useRoute()

const app = ref(null)
const loading = ref(true)
const error = ref(null)

const imageUrl = computed(() => {
  const img = Array.isArray(app.value?.image) ? app.value.image[0] : app.value?.image
  if (!img?.url) return null
  return img.url.startsWith('/') ? `${API_BASE_URL}${img.url}` : img.url
})

const relatedArticles = computed(() => app.value?.articles || [])
const relatedDatasets = computed(() => app.value?.datasets || [])

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const goBack = () => router.push('/apps')
const goToArticle = (id) => router.push(`/article/${id}`)
const goToDataset = (id) => router.push(`/datasets/${id}`)

const loadApp = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await fetchAppById(route.params.id)
    if (Array.isArray(data.image)) data.image = data.image[0] || null
    if (!Array.isArray(data.articles)) data.articles = []
    if (!Array.isArray(data.datasets)) data.datasets = []
    if (!Array.isArray(data.contributors)) data.contributors = []
    app.value = data
  } catch (err) {
    error.value = `Failed to load app: ${err.message}`
  } finally {
    loading.value = false
  }
}

const showScrollTop = ref(false)
const onScroll = () => { showScrollTop.value = window.scrollY > 300 }
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

onMounted(() => {
  loadApp()
  window.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>
