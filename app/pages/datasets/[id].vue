<template>
  <div class="max-w-[900px] mx-auto px-4 py-6">
    <div v-if="loading" class="flex flex-col items-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
      <p class="mt-4 text-gray-500">Loading dataset...</p>
    </div>

    <div v-else-if="error" class="text-center py-16">
      <UAlert color="error" :description="error" class="mb-4" />
      <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack">Back to Datasets</UButton>
    </div>

    <template v-else-if="dataset">
      <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack" class="mb-6">
        Back to Datasets
      </UButton>

      <div v-if="dataset.categories?.length" class="flex flex-wrap gap-2 mb-4">
        <UBadge v-for="cat in dataset.categories" :key="cat" color="primary" variant="subtle">{{ cat }}</UBadge>
      </div>

      <h1 class="text-3xl font-bold mb-3" style="line-height:1.3">{{ dataset.title }}</h1>

      <div class="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500">
        <span v-if="dataset.date">{{ formatDate(dataset.date) }}</span>
        <span v-if="dataset.unit">Unit: {{ dataset.unit }}</span>
        <UBadge v-if="dataset.external" color="warning" variant="subtle">External</UBadge>
        <UBadge v-if="dataset.project" color="info" variant="subtle">Project</UBadge>
      </div>

      <div v-if="dataset.tags?.length" class="mb-6">
        <span class="font-bold mr-3 text-sm">Tags:</span>
        <UBadge v-for="tag in dataset.tags" :key="tag" variant="subtle" class="mr-2 mb-2">{{ tag }}</UBadge>
      </div>

      <div v-if="dataset.timeperiod" class="border border-gray-200 rounded-lg mb-6 max-w-[400px]">
        <div class="px-4 py-3 border-b border-gray-200 font-semibold text-base">Time Period</div>
        <div class="p-4 flex flex-wrap gap-4 text-sm">
          <div><span class="font-medium text-gray-500">Year Type:</span> {{ dataset.timeperiod.yeartype || '—' }}</div>
          <div><span class="font-medium text-gray-500">From:</span> {{ dataset.timeperiod.yearmin || '—' }}</div>
          <div><span class="font-medium text-gray-500">To:</span> {{ dataset.timeperiod.yearmax || '—' }}</div>
        </div>
      </div>

      <template v-if="dataset.sources?.length">
        <h3 class="text-base font-bold mb-3">Sources</h3>
        <div class="mb-6">
          <div v-for="(source, i) in dataset.sources" :key="i" class="mb-3">
            <strong class="text-sm">{{ source.title }}</strong>
            <div v-if="source.url && source.url !== 'undefined'">
              <a :href="source.url" target="_blank" rel="noopener noreferrer" class="text-blue-600 text-sm">{{ source.url }}</a>
            </div>
          </div>
        </div>
      </template>

      <div v-if="dataset.description" class="border border-gray-200 rounded-lg p-5 mb-4">
        <h3 class="text-base font-bold mb-2">Description</h3>
        <p class="text-sm leading-relaxed">{{ dataset.description }}</p>
      </div>

      <template v-if="notesList.length">
        <h3 class="text-base font-bold mb-3">Notes</h3>
        <ol class="text-sm mb-6 pl-6 list-decimal">
          <li v-for="(note, i) in notesList" :key="i" class="mb-2">{{ note }}</li>
        </ol>
      </template>

      <template v-if="dataset.variables?.length">
        <h3 class="text-base font-bold mb-3">Variables ({{ dataset.variables.length }})</h3>
        <div class="overflow-x-auto mb-6">
          <table class="w-full text-sm border-collapse">
            <thead class="bg-gray-100">
              <tr>
                <th class="text-left p-3 border border-gray-200">Name</th>
                <th class="text-left p-3 border border-gray-200">Type</th>
                <th class="text-left p-3 border border-gray-200">Definition</th>
                <th class="text-left p-3 border border-gray-200">Values</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(v, i) in dataset.variables" :key="i" class="hover:bg-gray-50">
                <td class="p-3 border border-gray-200"><strong>{{ v.name }}</strong></td>
                <td class="p-3 border border-gray-200">{{ v.type }}</td>
                <td class="p-3 border border-gray-200">{{ v.definition }}</td>
                <td class="p-3 border border-gray-200">{{ v.values }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template v-if="datafileList.length">
        <h3 class="text-base font-bold mb-3">Data Files</h3>
        <div class="flex flex-wrap gap-2 mb-6">
          <UButton
            v-for="file in datafileList"
            :key="file.id"
            :to="datafileUrl(file)"
            :download="file.name"
            target="_blank"
            rel="noopener noreferrer"
            icon="i-heroicons-arrow-down-tray"
            variant="soft"
            size="sm"
          >
            {{ file.name }}
            <span v-if="file.size" class="text-xs ml-1 opacity-70">({{ formatFileSize(file.size) }})</span>
          </UButton>
        </div>
      </template>

      <div v-if="dataset.funding" class="bg-gray-100 rounded p-4 mb-4">
        <h4 class="text-sm font-bold mb-2">Funding</h4>
        <p class="text-sm leading-relaxed" v-html="dataset.funding"></p>
      </div>

      <div v-if="dataset.citation" class="bg-gray-100 rounded p-4 mb-4">
        <h4 class="text-sm font-bold mb-2">Citation</h4>
        <p class="text-sm leading-relaxed" v-html="dataset.citation"></p>
      </div>

      <template v-if="relatedApps.length">
        <h3 class="text-base font-bold mb-3">Related Apps</h3>
        <div class="flex flex-wrap gap-2 mb-6">
          <UBadge
            v-for="app in relatedApps"
            :key="app.documentId || app.id"
            color="primary"
            variant="outline"
            class="cursor-pointer"
            @click="goToApp(app.documentId)"
          >{{ app.Title || app.title || app.id }}</UBadge>
        </div>
      </template>

      <template v-if="relatedArticles.length">
        <h3 class="text-base font-bold mb-3">Related Articles</h3>
        <div class="flex flex-wrap gap-2 mb-6">
          <UBadge
            v-for="article in relatedArticles"
            :key="article.documentId || article.id"
            color="neutral"
            variant="outline"
            class="cursor-pointer"
            @click="goToArticle(article.documentId)"
          >{{ article.Title || article.title || article.id }}</UBadge>
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
import { fetchDatasetById, API_BASE_URL } from '~/services/api'

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
const goToApp = (id) => router.push(`/apps/${id}`)
const goToArticle = (id) => router.push(`/article/${id}`)

const loadDataset = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await fetchDatasetById(route.params.id)
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
