<template>
  <div class="min-h-screen flex flex-col">
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

    <main class="flex-1 bg-gray-200">
      <div class="preview-content" :class="viewMode">
        <!-- Mobile Frame -->
        <div class="device-frame" v-if="viewMode === 'mobile'">
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
                <span v-if="dataset.Unit">Unit: {{ dataset.Unit }}</span>
                <UBadge v-if="dataset.external" color="warning" variant="subtle" size="sm">External</UBadge>
                <UBadge v-if="dataset.project" color="info" variant="subtle" size="sm">Project</UBadge>
              </div>
              <div v-if="dataset.tags?.length" class="mb-2">
                <span class="text-xs font-bold mr-1">Tags:</span>
                <UBadge v-for="tag in dataset.tags" :key="tag" variant="subtle" size="sm" class="mr-1">{{ tag }}</UBadge>
              </div>
              <div v-if="dataset.Timeperiod" class="p-3 mb-3 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-1">Time Period</p>
                <div class="text-xs">
                  <div>Year Type: {{ dataset.Timeperiod.yeartype || '—' }}</div>
                  <div>From: {{ dataset.Timeperiod.yearmin || '—' }}</div>
                  <div>To: {{ dataset.Timeperiod.yearmax || '—' }}</div>
                </div>
              </div>
              <div v-if="dataset.Sources?.length" class="mb-3">
                <p class="text-xs font-bold mb-1">Sources</p>
                <div v-for="(source, i) in dataset.Sources" :key="i" class="mb-1">
                  <strong class="text-xs">{{ source.title }}</strong>
                  <div v-if="source.url && source.url !== 'undefined'">
                    <a :href="source.url" target="_blank" rel="noopener noreferrer" class="text-blue-600 text-xs">{{ source.url }}</a>
                  </div>
                </div>
              </div>
              <div v-if="dataset.Description" class="p-3 mb-3 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-1">Description</p>
                <p class="text-xs">{{ dataset.Description }}</p>
              </div>
              <div v-if="notesList.length" class="mb-3">
                <p class="text-xs font-bold mb-1">Notes</p>
                <ol class="text-xs pl-4 list-decimal">
                  <li v-for="(note, i) in notesList" :key="i" class="mb-1">{{ note }}</li>
                </ol>
              </div>
              <div v-if="dataset.Variables?.length" class="mb-3">
                <p class="text-xs font-bold mb-1">Variables ({{ dataset.Variables.length }})</p>
                <div v-for="(v, i) in dataset.Variables" :key="i" class="p-2 mb-1 bg-gray-100 rounded text-xs">
                  <strong>{{ v.name }}</strong><span v-if="v.type"> · {{ v.type }}</span>
                  <div v-if="v.definition" class="text-gray-500">{{ v.definition }}</div>
                </div>
              </div>
              <div v-if="dataset.Funding" class="p-3 mb-2 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-1">Funding</p>
                <p class="text-xs" v-html="dataset.Funding"></p>
              </div>
              <div v-if="dataset.Citation" class="p-3 mb-2 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-1">Citation</p>
                <p class="text-xs" v-html="dataset.Citation"></p>
              </div>
              <div v-if="dataset.Datafile?.length" class="mb-3">
                <p class="text-xs font-bold mb-1">Data Files</p>
                <div class="flex flex-wrap gap-1">
                  <UButton v-for="file in dataset.Datafile" :key="file.id" :to="datafileUrl(file)" :download="file.name" target="_blank" rel="noopener noreferrer" icon="i-heroicons-arrow-down-tray" variant="soft" size="xs">{{ file.name }}</UButton>
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

        <!-- Desktop View -->
        <div v-else class="max-w-[900px] mx-auto w-full py-6 px-4">
          <div v-if="loading" class="flex flex-col items-center py-16">
            <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
          </div>
          <div v-else-if="dataset" class="bg-white rounded-xl shadow-md p-8">
            <div v-if="dataset.categories?.length" class="flex flex-wrap gap-2 mb-4">
              <UBadge v-for="cat in dataset.categories" :key="cat" color="primary" variant="subtle">{{ cat }}</UBadge>
            </div>
            <h1 class="text-3xl font-bold mb-3" style="line-height:1.3">{{ dataset.title }}</h1>
            <div class="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500">
              <span v-if="dataset.date">{{ formatDate(dataset.date) }}</span>
              <span v-if="dataset.Unit">Unit: {{ dataset.Unit }}</span>
              <UBadge v-if="dataset.external" color="warning" variant="subtle">External</UBadge>
              <UBadge v-if="dataset.project" color="info" variant="subtle">Project</UBadge>
            </div>
            <div v-if="dataset.tags?.length" class="mb-6">
              <span class="font-bold mr-3 text-sm">Tags:</span>
              <UBadge v-for="tag in dataset.tags" :key="tag" variant="subtle" class="mr-2 mb-2">{{ tag }}</UBadge>
            </div>
            <div v-if="dataset.Timeperiod" class="border border-gray-200 rounded-lg mb-6 max-w-[400px]">
              <div class="px-4 py-3 border-b border-gray-200 font-semibold text-base">Time Period</div>
              <div class="p-4 flex flex-wrap gap-4 text-sm">
                <div><span class="font-medium text-gray-500">Year Type:</span> {{ dataset.Timeperiod.yeartype || '—' }}</div>
                <div><span class="font-medium text-gray-500">From:</span> {{ dataset.Timeperiod.yearmin || '—' }}</div>
                <div><span class="font-medium text-gray-500">To:</span> {{ dataset.Timeperiod.yearmax || '—' }}</div>
              </div>
            </div>
            <template v-if="dataset.Sources?.length">
              <h3 class="text-base font-bold mb-3">Sources</h3>
              <div class="mb-6">
                <div v-for="(source, i) in dataset.Sources" :key="i" class="mb-3">
                  <strong class="text-sm">{{ source.title }}</strong>
                  <div v-if="source.url && source.url !== 'undefined'">
                    <a :href="source.url" target="_blank" rel="noopener noreferrer" class="text-blue-600 text-sm">{{ source.url }}</a>
                  </div>
                </div>
              </div>
            </template>
            <div v-if="dataset.Description" class="border border-gray-200 rounded-lg p-5 mb-4">
              <h3 class="text-base font-bold mb-2">Description</h3>
              <p class="text-sm leading-relaxed">{{ dataset.Description }}</p>
            </div>
            <template v-if="notesList.length">
              <h3 class="text-base font-bold mb-3">Notes</h3>
              <ol class="text-sm mb-6 pl-6 list-decimal">
                <li v-for="(note, i) in notesList" :key="i" class="mb-2">{{ note }}</li>
              </ol>
            </template>
            <template v-if="dataset.Variables?.length">
              <h3 class="text-base font-bold mb-3">Variables ({{ dataset.Variables.length }})</h3>
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
                    <tr v-for="(v, i) in dataset.Variables" :key="i" class="hover:bg-gray-50">
                      <td class="p-3 border border-gray-200"><strong>{{ v.name }}</strong></td>
                      <td class="p-3 border border-gray-200">{{ v.type }}</td>
                      <td class="p-3 border border-gray-200">{{ v.definition }}</td>
                      <td class="p-3 border border-gray-200">{{ v.values }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
            <div v-if="dataset.Funding" class="bg-gray-100 rounded p-4 mb-4">
              <h4 class="text-sm font-bold mb-2">Funding</h4>
              <p class="text-sm leading-relaxed" v-html="dataset.Funding"></p>
            </div>
            <div v-if="dataset.Citation" class="bg-gray-100 rounded p-4 mb-4">
              <h4 class="text-sm font-bold mb-2">Citation</h4>
              <p class="text-sm leading-relaxed" v-html="dataset.Citation"></p>
            </div>
            <template v-if="dataset.Datafile?.length">
              <h3 class="text-base font-bold mb-3">Data Files</h3>
              <div class="flex flex-wrap gap-2 mb-6">
                <UButton v-for="file in dataset.Datafile" :key="file.id" :to="datafileUrl(file)" :download="file.name" target="_blank" rel="noopener noreferrer" icon="i-heroicons-arrow-down-tray" variant="soft" size="sm">{{ file.name }}</UButton>
              </div>
            </template>
            <template v-if="Array.isArray(dataset.apps) && dataset.apps.length">
              <h3 class="text-base font-bold mb-3">Related Apps</h3>
              <div class="flex flex-wrap gap-2 mb-6">
                <UBadge v-for="app in dataset.apps" :key="app.documentId || app.id" variant="outline">{{ app.Title || app.title || app.id }}</UBadge>
              </div>
            </template>
            <template v-if="Array.isArray(dataset.articles) && dataset.articles.length">
              <h3 class="text-base font-bold mb-3">Related Articles</h3>
              <div class="flex flex-wrap gap-2 mb-6">
                <UBadge v-for="article in dataset.articles" :key="article.documentId || article.id" variant="outline">{{ article.Title || article.title || article.id }}</UBadge>
              </div>
            </template>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ middleware: ['preview-access'] })

import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchDatasetPreviewById, publishDataset, API_BASE_URL as API_URL } from '~/services/api'

const route = useRoute()
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
  const n = dataset.value?.Notes
  if (!n) return []
  if (Array.isArray(n)) return n
  if (typeof n === 'string') { try { return JSON.parse(n) } catch { return [n] } }
  return []
})

const datafileUrl = (file) => {
  if (!file?.url) return '#'
  return file.url.startsWith('/') ? `${API_BASE_URL}${file.url}` : file.url
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
.preview-content { min-height: calc(100vh - 56px); display: flex; justify-content: center; }
.preview-content.mobile { padding: 40px 20px; align-items: flex-start; }
.device-frame { width: 375px; background: #1a1a1a; border-radius: 40px; padding: 12px; box-shadow: 0 0 0 2px #333, 0 20px 50px rgba(0,0,0,0.3), inset 0 0 0 2px #000; }
.device-notch { width: 150px; height: 28px; background: #1a1a1a; border-radius: 0 0 20px 20px; margin: 0 auto; position: relative; top: -1px; z-index: 10; }
.device-screen { background: #fff; border-radius: 30px; overflow: hidden; height: 700px; overflow-y: auto; }
.device-screen::-webkit-scrollbar { width: 0; }
.device-home-bar { width: 120px; height: 5px; background: #666; border-radius: 3px; margin: 12px auto 0; }
</style>
