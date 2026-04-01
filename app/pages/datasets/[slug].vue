<template>
  <div class="min-h-screen flex flex-col">
    <div v-if="loading" class="flex justify-center py-16 bg-gray-100 flex-1">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
    </div>

    <div v-else-if="error" class="text-center py-16 bg-gray-100 flex-1">
      <UAlert color="error" :description="error" class="mb-4" />
      <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack">Back to Datasets</UButton>
    </div>

    <template v-else-if="dataset">
      <!-- White header section -->
      <div class="bg-white">
        <div class="max-w-[1300px] mx-auto pt-4 px-4 pb-3 sm:pt-6 sm:px-6 sm:pb-4">
          <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack" class="mb-4">
            Back to Datasets
          </UButton>

          <!-- Title Row -->
          <div class="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 bg-primary-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <UIcon name="i-heroicons-circle-stack" class="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 class="text-xl font-bold text-gray-900 leading-tight sm:text-2xl">{{ dataset.title }}</h1>
              </div>
            </div>
          </div>

          <!-- Meta Row -->
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 ml-0 sm:ml-[52px] mb-3">
            <span v-if="dataset.date" class="flex items-center gap-1.5">
              <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
              Last Updated: {{ formatDate(dataset.date) }}
            </span>
            <UBadge v-if="dataset.external" color="warning" variant="subtle">External</UBadge>
            <UBadge v-if="dataset.project" color="info" variant="subtle">Project</UBadge>
          </div>

          <!-- Tags / Categories -->
          <div v-if="dataset.categories?.length || dataset.tags?.length" class="flex flex-wrap gap-2 ml-0 sm:ml-[52px]">
            <UBadge v-for="cat in dataset.categories" :key="cat" color="primary" variant="subtle">{{ cat }}</UBadge>
            <UBadge v-for="tag in dataset.tags" :key="tag" variant="subtle">{{ tag }}</UBadge>
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
            <div class="flex-1 min-w-0 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <!-- Overview Card -->
              <div class="bg-[#1a3a5c] text-white px-6 py-4">
                <h2 class="text-lg font-bold">Overview: {{ dataset.title }}</h2>
                <!-- <p v-if="dataset.unit" class="text-sm text-blue-200 mt-1">{{ dataset.unit }}</p> -->
              </div>

              <div class="p-6 space-y-8">
                <!-- Summary -->
                <div v-if="dataset.description">
                  <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-information-circle" class="w-6 h-6 text-blue-700" />
                    <h3 class="text-lg font-bold text-gray-800">Summary</h3>
                  </div>
                  <p class="text-gray-700 leading-relaxed">{{ dataset.description }}</p>
                </div>

                <!-- Key Findings (Notes) -->
                <div v-if="notesList.length">
                  <div class="flex items-center gap-2 mb-4">
                    <UIcon name="i-heroicons-list-bullet" class="w-6 h-6 text-blue-700" />
                    <h3 class="text-lg font-bold text-gray-800">Key Findings</h3>
                  </div>
                  <div class="space-y-4">
                    <div v-for="(note, i) in notesList" :key="i" class="flex gap-4">
                      <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold mt-0.5">{{ i + 1 }}</div>
                      <div>
                        <template v-if="typeof note === 'object' && note !== null">
                          <p class="font-bold text-gray-800">{{ note.title || note.heading }}</p>
                          <p v-if="note.description || note.text || note.body" class="text-gray-600 text-sm mt-1">{{ note.description || note.text || note.body }}</p>
                        </template>
                        <p v-else class="text-gray-700">{{ note }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Dataset Section (Variables + Downloads) -->
                <div v-if="dataset.variables?.length || datafileList.length">
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-heroicons-circle-stack" class="w-6 h-6 text-blue-700" />
                      <h3 class="text-lg font-bold text-gray-800">Dataset: {{ dataset.title }}</h3>
                    </div>
                    <div v-if="datafileList.length" class="flex flex-wrap gap-2">
                      <UButton
                        v-for="file in datafileList"
                        :key="file.id"
                        :to="datafileUrl(file)"
                        :download="file.name"
                        target="_blank"
                        rel="noopener noreferrer"
                        icon="i-heroicons-arrow-down-tray"
                        variant="outline"
                        size="sm"
                      >
                       Download CSV
                        
                      </UButton>
                    </div>
                  </div>
                  <div v-if="dataset.variables?.length" class="overflow-x-auto">
                    <table class="w-full text-sm border-collapse">
                      <thead>
                        <tr class="border-b-2 border-gray-200">
                          <th class="text-left p-3 font-semibold text-gray-700">
                            <div class="flex items-center gap-1">Name <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-gray-400" /></div>
                          </th>
                          <th class="text-left p-3 font-semibold text-gray-700">
                            <div class="flex items-center gap-1">Type <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-gray-400" /></div>
                          </th>
                          <th class="text-left p-3 font-semibold text-gray-700">
                            <div class="flex items-center gap-1">Definition <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-gray-400" /></div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(v, i) in dataset.variables" :key="i" :class="i % 2 === 1 ? 'bg-gray-50' : ''">
                          <td class="p-3 border-b border-gray-100 font-medium">{{ v.name }}</td>
                          <td class="p-3 border-b border-gray-100">{{ v.type }}</td>
                          <td class="p-3 border-b border-gray-100">{{ v.definition }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Sources -->
                <div v-if="dataset.sources?.length">
                  <h3 class="text-base font-bold mb-3 text-gray-800">Sources</h3>
                  <div v-for="(source, i) in dataset.sources" :key="i" class="mb-3">
                    <strong class="text-sm">{{ source.title }}</strong>
                    <div v-if="source.url && source.url !== 'undefined'">
                      <a :href="source.url" target="_blank" rel="noopener noreferrer" class="text-blue-600 text-sm">{{ source.url }}</a>
                    </div>
                  </div>
                </div>

                <!-- Time Period -->
                <div v-if="dataset.timeperiod">
                  <h3 class="text-base font-bold mb-3 text-gray-800">Time Period</h3>
                  <div class="border border-gray-200 rounded-lg max-w-[400px]">
                    <div class="p-4 flex flex-wrap gap-4 text-sm">
                      <div><span class="font-medium text-gray-500">Year Type:</span> {{ dataset.timeperiod.yeartype || '—' }}</div>
                      <div><span class="font-medium text-gray-500">From:</span> {{ dataset.timeperiod.yearmin || '—' }}</div>
                      <div><span class="font-medium text-gray-500">To:</span> {{ dataset.timeperiod.yearmax || '—' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Sidebar -->
            <div class="w-full lg:w-[260px] lg:flex-shrink-0 space-y-4">
              <!-- Suggested Citation -->
              <div v-if="dataset.citation" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 class="font-bold text-gray-800 mb-2">Suggested Citation</h4>
                <p class="text-sm text-gray-600 leading-relaxed break-words" v-html="dataset.citation"></p>
              </div>

              <!-- Related Content -->
              <div v-if="relatedApps.length || relatedArticles.length" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 class="font-bold text-gray-800 mb-3">Related Content</h4>
                <div class="space-y-2">
                  <a
                    v-for="app in relatedApps"
                    :key="app.slug || app.documentId || app.id"
                    href="#"
                    @click.prevent="goToApp(app)"
                    class="block text-sm text-blue-600 hover:underline leading-snug"
                  >{{ app.Title || app.title }}</a>
                  <a
                    v-for="article in relatedArticles"
                    :key="article.slug || article.documentId || article.id"
                    href="#"
                    @click.prevent="goToArticle(article)"
                    class="block text-sm text-blue-600 hover:underline leading-snug"
                  >{{ article.Title || article.title }}</a>
                </div>
              </div>

              <!-- Funding Acknowledgement -->
              <div v-if="dataset.funding" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <h4 class="font-bold text-gray-800 mb-2">Funding Acknowledgement</h4>
                <p class="text-sm text-gray-600 leading-relaxed" v-html="dataset.funding"></p>
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
import { fetchDatasetBySlug, API_BASE_URL } from '~/services/api'

const router = useRouter()
const route = useRoute()

const dataset = ref(null)
const loading = ref(true)
const error = ref(null)

const notesList = computed(() => {
  const n = dataset.value?.notes
  if (!n) return []
  if (Array.isArray(n)) return n
  if (typeof n === 'string') {
    try { return JSON.parse(n) } catch { return [n] }
  }
  return []
})

const datafileList = computed(() => {
  const df = dataset.value?.datafile
  if (!df) return []
  if (Array.isArray(df)) return df
  if (typeof df === 'object' && df.id) return [df]
  return []
})

const relatedApps = computed(() => dataset.value?.apps || [])
const relatedArticles = computed(() => dataset.value?.articles || [])

const datafileUrl = (file) => {
  if (!file?.url) return '#'
  return file.url.startsWith('/') ? `${API_BASE_URL}${file.url}` : file.url
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const goBack = () => router.push('/datasets')
const goToApp = (item) => router.push(`/apps/${item.slug || item.documentId || item.id}`)
const goToArticle = (item) => router.push(`/article/${item.slug || item.documentId || item.id}`)

const loadDataset = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await fetchDatasetBySlug(route.params.slug)
    if (!Array.isArray(data.apps)) data.apps = []
    if (!Array.isArray(data.articles)) data.articles = []
    dataset.value = data
  } catch (err) {
    error.value = `Failed to load dataset: ${err.message}`
  } finally {
    loading.value = false
  }
}

const showScrollTop = ref(false)
const onScroll = () => { showScrollTop.value = window.scrollY > 300 }
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

onMounted(() => {
  loadDataset()
  window.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>
