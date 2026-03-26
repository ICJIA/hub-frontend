<template>
  <div class="min-h-screen flex flex-col">
    <!-- Preview Header Bar -->
    <header class="sticky top-0 z-50 bg-[#1a1a2e] h-14 flex items-center px-4 shadow-lg">
      <div class="flex items-center justify-center gap-5 flex-wrap w-full">
        <span class="text-xs text-gray-400 uppercase font-medium tracking-wide">Dataset Preview</span>
        <UButton color="success" size="sm" icon="i-heroicons-check" :loading="publishing" @click="handlePublish">Publish</UButton>
        <div class="flex border border-white/20 rounded-lg overflow-hidden">
          <button :class="['px-3 py-1.5 text-sm flex items-center gap-1', viewMode === 'desktop' ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10']" @click="viewMode = 'desktop'">
            <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4" /> Desktop
          </button>
          <button :class="['px-3 py-1.5 text-sm flex items-center gap-1 border-l border-white/20', viewMode === 'mobile' ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10']" @click="viewMode = 'mobile'">
            <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4" /> Mobile
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 bg-gray-100">
      <!-- Mobile Frame -->
      <div v-if="viewMode === 'mobile'" class="flex justify-center py-10 px-5">
        <div class="device-frame">
          <div class="device-notch"></div>
          <div class="device-screen">
            <div v-if="loading" class="flex flex-col items-center py-10">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-blue-500" />
            </div>
            <div v-else-if="dataset" class="p-4">
              <div v-if="dataset.categories?.length" class="flex flex-wrap gap-1 mb-2">
                <UBadge v-for="cat in dataset.categories" :key="cat" color="primary" variant="subtle" size="sm">{{ cat }}</UBadge>
              </div>
              <h1 class="text-xl font-bold mb-2" style="line-height:1.3">{{ dataset.title }}</h1>
              <div class="flex gap-2 mb-2 text-xs text-gray-500 flex-wrap">
                <span v-if="dataset.date">{{ formatDate(dataset.date) }}</span>
                <span v-if="dataset.unit">Unit: {{ dataset.unit }}</span>
                <UBadge v-if="dataset.external" color="warning" variant="subtle" size="sm">External</UBadge>
                <UBadge v-if="dataset.project" color="info" variant="subtle" size="sm">Project</UBadge>
              </div>
              <div v-if="dataset.tags?.length" class="mb-2">
                <span class="text-xs font-bold mr-1">Tags:</span>
                <UBadge v-for="tag in dataset.tags" :key="tag" variant="subtle" size="sm" class="mr-1">{{ tag }}</UBadge>
              </div>
              <div v-if="dataset.timeperiod" class="p-3 mb-3 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-1">Time Period</p>
                <div class="text-xs">
                  <div>Year Type: {{ dataset.timeperiod.yeartype || '—' }}</div>
                  <div>From: {{ dataset.timeperiod.yearmin || '—' }}</div>
                  <div>To: {{ dataset.timeperiod.yearmax || '—' }}</div>
                </div>
              </div>
              <div v-if="dataset.sources?.length" class="mb-3">
                <p class="text-xs font-bold mb-1">Sources</p>
                <div v-for="(source, i) in dataset.sources" :key="i" class="mb-1">
                  <strong class="text-xs">{{ source.title }}</strong>
                  <div v-if="source.url && source.url !== 'undefined'">
                    <a :href="source.url" target="_blank" rel="noopener noreferrer" class="text-blue-600 text-xs">{{ source.url }}</a>
                  </div>
                </div>
              </div>
              <div v-if="dataset.description" class="p-3 mb-3 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-1">Description</p>
                <p class="text-xs">{{ dataset.description }}</p>
              </div>
              <div v-if="notesList.length" class="mb-3">
                <p class="text-xs font-bold mb-1">Notes</p>
                <ol class="text-xs pl-4 list-decimal">
                  <li v-for="(note, i) in notesList" :key="i" class="mb-1">{{ typeof note === 'object' ? (note.title || note.heading) : note }}</li>
                </ol>
              </div>
              <div v-if="dataset.variables?.length" class="mb-3">
                <p class="text-xs font-bold mb-1">Variables ({{ dataset.variables.length }})</p>
                <div v-for="(v, i) in dataset.variables" :key="i" class="p-2 mb-1 bg-gray-100 rounded text-xs">
                  <strong>{{ v.name }}</strong><span v-if="v.type"> · {{ v.type }}</span>
                  <div v-if="v.definition" class="text-gray-500">{{ v.definition }}</div>
                </div>
              </div>
              <div v-if="dataset.funding" class="p-3 mb-2 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-1">Funding</p>
                <p class="text-xs" v-html="dataset.funding"></p>
              </div>
              <div v-if="dataset.citation" class="p-3 mb-2 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-1">Citation</p>
                <p class="text-xs" v-html="dataset.citation"></p>
              </div>
              <div v-if="datafileList.length" class="mb-3">
                <p class="text-xs font-bold mb-1">Data Files</p>
                <div class="flex flex-wrap gap-1">
                  <UButton v-for="file in datafileList" :key="file.id" :to="datafileUrl(file)" :download="file.name" target="_blank" rel="noopener noreferrer" icon="i-heroicons-arrow-down-tray" variant="soft" size="xs">{{ file.name }}</UButton>
                </div>
              </div>
              <div v-if="Array.isArray(dataset.apps) && dataset.apps.length" class="mb-2">
                <p class="text-xs font-bold mb-1">Related Apps</p>
                <div class="flex flex-wrap gap-1">
                  <UBadge v-for="app in dataset.apps" :key="app.documentId || app.id" variant="outline" size="sm">{{ app.Title || app.title || app.id }}</UBadge>
                </div>
              </div>
              <div v-if="Array.isArray(dataset.articles) && dataset.articles.length" class="mb-2">
                <p class="text-xs font-bold mb-1">Related Articles</p>
                <div class="flex flex-wrap gap-1">
                  <UBadge v-for="article in dataset.articles" :key="article.documentId || article.id" variant="outline" size="sm">{{ article.Title || article.title || article.id }}</UBadge>
                </div>
              </div>
            </div>
          </div>
          <div class="device-home-bar"></div>
        </div>
      </div>

      <!-- Desktop View -->
      <div v-else>
        <div v-if="loading" class="flex justify-center py-16">
          <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
        </div>

        <div v-else-if="error" class="text-center py-16">
          <UAlert color="error" :description="error" class="mb-4" />
        </div>

        <template v-else-if="dataset">
          <!-- White header section -->
          <div class="bg-white">
            <div class="max-w-[1300px] mx-auto pt-4 px-4 pb-3 sm:pt-6 sm:px-6 sm:pb-4">
              <!-- Title Row -->
              <div class="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 bg-primary-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <UIcon name="i-heroicons-circle-stack" class="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 class="text-xl font-bold text-gray-900 leading-tight sm:text-2xl">{{ dataset.title }}</h1>
                    <p v-if="dataset.unit" class="text-sm text-gray-500 mt-0.5">{{ dataset.unit }}</p>
                  </div>
                </div>
              </div>

              <!-- Meta Row -->
              <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 ml-0 sm:ml-[52px] mb-3">
                <span v-if="dataset.date" class="flex items-center gap-1.5">
                  <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
                  Last Updated: {{ formatDate(dataset.date) }}
                </span>
                <a
                  v-for="file in datafileList"
                  :key="file.id"
                  :href="datafileUrl(file)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-1.5 text-blue-600 hover:underline"
                >
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
                  {{ file.name }}
                </a>
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
                    <p v-if="dataset.unit" class="text-sm text-blue-200 mt-1">{{ dataset.unit }}</p>
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
                            {{ file.name }}
                            <span v-if="file.size" class="text-xs ml-1 opacity-70">({{ formatFileSize(file.size) }})</span>
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
                  <div v-if="(dataset.apps?.length || dataset.articles?.length)" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <h4 class="font-bold text-gray-800 mb-3">Related Content</h4>
                    <div class="space-y-2">
                      <a
                        v-for="app in dataset.apps"
                        :key="app.documentId || app.id"
                        :href="`/apps/${app.documentId || app.id}`"
                        class="block text-sm text-blue-600 hover:underline leading-snug"
                      >{{ app.Title || app.title }}</a>
                      <a
                        v-for="article in dataset.articles"
                        :key="article.documentId || article.id"
                        :href="`/article/${article.documentId || article.id}`"
                        class="block text-sm text-blue-600 hover:underline leading-snug"
                      >{{ article.Title || article.title }}</a>
                    </div>
                  </div>

                  <!-- Funding Acknowledgement -->
                  <div v-if="dataset.funding" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <h4 class="font-bold text-gray-800 mb-2">Funding Acknowledgement</h4>
                    <p class="text-sm text-gray-600 leading-relaxed" v-html="dataset.funding"></p>
                  </div>

                  <!-- View Published Dataset -->
                  <button @click="viewPublishedDataset" class="w-full bg-primary-500 text-white py-2.5 rounded font-medium hover:bg-blue-800 transition-colors cursor-pointer">
                    View Published Dataset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ middleware: ['preview-access'] })

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchDatasetPreviewById, publishDataset, API_BASE_URL as API_URL } from '~/services/api'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const API_BASE_URL = API_URL

const dataset = ref(null)
const loading = ref(true)
const error = ref(null)
const viewMode = ref('desktop')
const publishing = ref(false)

const handlePublish = async () => {
  publishing.value = true
  try { await publishDataset(route.params.id); toast.add({ title: 'Dataset published successfully!', color: 'green' }) }
  catch (err) { toast.add({ title: `Failed to publish: ${err.message}`, color: 'red' }) }
  finally { publishing.value = false }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const notesList = computed(() => {
  const n = dataset.value?.notes
  if (!n) return []
  if (Array.isArray(n)) return n
  if (typeof n === 'string') { try { return JSON.parse(n) } catch { return [n] } }
  return []
})

const datafileList = computed(() => {
  const df = dataset.value?.datafile
  if (!df) return []
  if (Array.isArray(df)) return df
  if (typeof df === 'object' && df.id) return [df]
  return []
})

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

const viewPublishedDataset = () => {
  const id = dataset.value?.documentId || dataset.value?.id
  if (id) router.push(`/datasets/${id}`)
}

const loadDataset = async () => {
  loading.value = true; error.value = null
  try { dataset.value = await fetchDatasetPreviewById(route.params.id) }
  catch (err) { error.value = `Failed to load dataset: ${err.message}` }
  finally { loading.value = false }
}

onMounted(() => { loadDataset() })
</script>

<style scoped>
.device-frame { width: 375px; background: #1a1a1a; border-radius: 40px; padding: 12px; box-shadow: 0 0 0 2px #333, 0 20px 50px rgba(0,0,0,0.3), inset 0 0 0 2px #000; }
.device-notch { width: 150px; height: 28px; background: #1a1a1a; border-radius: 0 0 20px 20px; margin: 0 auto; position: relative; top: -1px; z-index: 10; }
.device-screen { background: #fff; border-radius: 30px; overflow: hidden; height: 700px; overflow-y: auto; }
.device-screen::-webkit-scrollbar { width: 0; }
.device-home-bar { width: 120px; height: 5px; background: #666; border-radius: 3px; margin: 12px auto 0; }
</style>
