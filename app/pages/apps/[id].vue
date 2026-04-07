<template>
  <div class="min-h-screen flex flex-col">
    <div v-if="loading" class="flex justify-center py-16 bg-gray-100 flex-1">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
    </div>

    <div v-else-if="error" class="text-center py-16 bg-gray-100 flex-1">
      <UAlert color="error" :description="error" class="mb-4" />
      <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack">Back to Apps</UButton>
    </div>

    <template v-else-if="app">
      <!-- White header section -->
      <div class="bg-white">
        <div class="max-w-[1300px] mx-auto pt-4 px-4 pb-3 sm:pt-6 sm:px-6 sm:pb-4">
          <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack" class="mb-4">
            Back to Apps
          </UButton>

          <!-- Title Row -->
          <div class="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 bg-primary-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <UIcon name="i-heroicons-computer-desktop" class="w-6 h-6 text-white" />
              </div>
              <h1 class="text-xl font-bold text-gray-900 leading-tight sm:text-2xl">{{ app.title }}</h1>
            </div>
            <div v-if="app.url" class="sm:flex-shrink-0">
              <a
                :href="app.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 bg-primary-500 text-white px-5 py-2.5 rounded font-medium hover:bg-blue-800 transition-colors text-sm"
              >
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" /> Launch
              </a>
            </div>
          </div>

          <!-- Meta Row -->
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 ml-0 sm:ml-[52px] mb-3">
            <span v-if="app.date" class="flex items-center gap-1.5">
              <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
              Last Updated: {{ formatDate(app.date) }}
            </span>
            <UBadge v-if="app.external" color="warning" variant="subtle">External</UBadge>
          </div>

          <!-- Tags / Categories -->
          <div v-if="app.categories?.length || app.tags?.length" class="flex flex-wrap gap-2 ml-0 sm:ml-[52px]">
            <UBadge v-for="cat in app.categories" :key="cat" color="primary" variant="subtle">{{ cat }}</UBadge>
            <UBadge v-for="tag in app.tags" :key="tag" variant="subtle">{{ tag }}</UBadge>
          </div>
        </div>
        <div class="h-[1px] w-full bg-gray-200"></div>
      </div>

      <!-- Gray content area -->
      <div class="flex-1 bg-gray-100">
        <div class="max-w-[1300px] mx-auto py-4 px-4 sm:py-6 sm:px-6">
          <!-- Two Column Layout -->
          <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
            <!-- Main Content -->
            <div class="flex-1 min-w-0 bg-white rounded-lg border border-gray-200 shadow-sm">
              <!-- Overview Card -->
              <div class="bg-white rounded-tl-lg rounded-tr-lg overflow-hidden shadow-sm mb-6">
                <div class="bg-[#1a3a5c] text-white px-6 py-4">
                  <h2 class="text-lg font-bold">Overview: {{ app.title }}</h2>
                  <p v-if="contributorsString" class="text-sm text-blue-200 mt-1">{{ contributorsString }}</p>
                </div>
                <img v-if="imageUrl" :src="imageUrl" :alt="app.title" class="w-full object-cover max-h-[450px]" />
              </div>

              <div class="p-6">
                <!-- Summary / Description -->
                <div v-if="app.description" class="mb-6">
                  <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-information-circle" class="w-6 h-6 text-blue-700" />
                    <h3 class="text-lg font-bold text-gray-800">Summary</h3>
                  </div>
                  <p class="text-gray-700 leading-relaxed">{{ app.description }}</p>
                </div>
              </div>
            </div>

            <!-- Right Sidebar -->
            <div class="w-full lg:w-[260px] lg:flex-shrink-0 space-y-4">
              <!-- Suggested Citation -->
              <div v-if="app.citation" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 class="font-bold text-gray-800 mb-2">Suggested Citation</h4>
                <p class="text-sm text-gray-600 leading-relaxed word-break" v-html="app.citation"></p>
              </div>

              <!-- Related Content -->
              <div v-if="relatedArticles.length || relatedDatasets.length" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 class="font-bold text-gray-800 mb-3">Related Content</h4>
                <div class="space-y-2">
                  <a
                    v-for="article in relatedArticles"
                    :key="article.documentId || article.id"
                    href="#"
                    @click.prevent="goToArticle(article.slug)"
                    class="block text-sm text-blue-600 hover:underline leading-snug"
                  >{{ article.title || article.Title }}</a>
                  <a
                    v-for="dataset in relatedDatasets"
                    :key="dataset.documentId || dataset.id"
                    href="#"
                    @click.prevent="goToDataset(dataset.slug)"
                    class="block text-sm text-blue-600 hover:underline leading-snug"
                  >{{ dataset.title || dataset.Title }}</a>
                </div>
              </div>

              <!-- Contributors -->
              <!-- <div v-if="app.contributors?.length" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 class="font-bold text-gray-800 mb-3">Contributors</h4>
                <div class="space-y-1">
                  <p v-for="(c, i) in app.contributors" :key="i" class="text-sm text-gray-600">{{ c.title }}</p>
                </div>
              </div> -->

              <!-- Funding Acknowledgement -->
              <div v-if="app.funding" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 class="font-bold text-gray-800 mb-2">Funding Acknowledgement</h4>
                <p class="text-sm text-gray-600 leading-relaxed" v-html="app.funding"></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Scroll to top -->
    <button
      v-if="showScrollTop"
      class="fixed bottom-6 right-6 z-10 bg-primary-500 text-white cursor-pointer rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-blue-800 transition-colors"
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

const router = useRouter()
const route = useRoute()
const { fetchAppBySlug } = useApps()

const app = ref(null)
const loading = ref(true)
const error = ref(null)

const imageUrl = computed(() => {
  const img = Array.isArray(app.value?.image) ? app.value.image[0] : app.value?.image
  if (!img?.url) return null
  return img.url.startsWith('/') ? `${API_BASE_URL}${img.url}` : img.url
})

const contributorsString = computed(() => app.value?.contributors?.map(c => c.title).join(', ') || '')
const relatedArticles = computed(() => app.value?.articles || [])
const relatedDatasets = computed(() => app.value?.datasets || [])

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const goBack = () => router.push('/apps')
const goToArticle = (id) => router.push(`/article/${id}`)
const goToDataset = (id) => router.push(`/datasets/${id}`)

const loadApp = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await fetchAppBySlug(route.params.id)
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
