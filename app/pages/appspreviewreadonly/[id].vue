<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-50 bg-[#1a1a2e] h-14 flex items-center px-4 shadow-lg">
      <div class="flex items-center justify-center gap-5 flex-wrap w-full">
        <span class="text-xs text-gray-400 uppercase font-medium tracking-wide">App Preview</span>
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
            <div v-else-if="app" class="p-4">
              <div v-if="app.image" class="mb-3">
                <img :src="resolveImageUrl(app.image)" :alt="app.Title" class="w-full rounded-lg" />
              </div>
              <div v-if="app.categories?.length" class="flex flex-wrap gap-1 mb-2">
                <UBadge v-for="cat in app.categories" :key="cat" color="primary" variant="subtle" size="sm">{{ cat }}</UBadge>
              </div>
              <h1 class="text-xl font-bold mb-2" style="line-height:1.3">{{ app.Title }}</h1>
              <div class="flex gap-2 mb-2 text-xs text-gray-500 flex-wrap">
                <span v-if="app.Date">{{ formatDate(app.Date) }}</span>
                <UBadge v-if="app.external" color="warning" variant="subtle" size="sm">External</UBadge>
              </div>
              <div v-if="app.contributors?.length" class="flex flex-wrap gap-1 mb-2">
                <UBadge v-for="(c, i) in app.contributors" :key="i" variant="outline" size="sm">{{ c.title }}</UBadge>
              </div>
              <div v-if="app.tags?.length" class="mb-2">
                <span class="text-xs font-bold mr-1">Tags:</span>
                <UBadge v-for="tag in app.tags" :key="tag" variant="subtle" size="sm" class="mr-1">{{ tag }}</UBadge>
              </div>
              <div v-if="app.description" class="p-3 mb-3 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-1">Description</p>
                <p class="text-xs">{{ app.description }}</p>
              </div>
              <div v-if="app.url" class="mb-3">
                <p class="text-xs font-bold mb-1">Link</p>
                <a :href="app.url" target="_blank" rel="noopener noreferrer" class="text-blue-600 text-xs">{{ app.url }}</a>
              </div>
              <div v-if="app.funding" class="p-3 mb-2 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-1">Funding</p>
                <p class="text-xs" v-html="app.funding"></p>
              </div>
              <div v-if="app.citation" class="p-3 mb-2 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-1">Citation</p>
                <p class="text-xs" v-html="app.citation"></p>
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
          <div v-else-if="app" class="bg-white rounded-xl shadow-md p-8">
            <img v-if="app.image" :src="resolveImageUrl(app.image)" :alt="app.Title" class="w-full rounded-lg mb-6 object-cover max-h-[400px]" />
            <div v-if="app.categories?.length" class="flex flex-wrap gap-2 mb-4">
              <UBadge v-for="cat in app.categories" :key="cat" color="primary" variant="subtle">{{ cat }}</UBadge>
            </div>
            <h1 class="text-3xl font-bold mb-3" style="line-height:1.3">{{ app.Title }}</h1>
            <div class="flex flex-wrap items-center gap-3 mb-4 text-sm text-gray-500">
              <span v-if="app.Date">{{ formatDate(app.Date) }}</span>
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
            <template v-if="Array.isArray(app.articles) && app.articles.length">
              <h3 class="text-base font-bold mb-3">Related Articles</h3>
              <div class="flex flex-wrap gap-2 mb-6">
                <UBadge v-for="article in app.articles" :key="article.documentId || article.id" variant="outline">{{ article.Title || article.title || article.id }}</UBadge>
              </div>
            </template>
            <template v-if="Array.isArray(app.datasets) && app.datasets.length">
              <h3 class="text-base font-bold mb-3">Related Datasets</h3>
              <div class="flex flex-wrap gap-2 mb-6">
                <UBadge v-for="dataset in app.datasets" :key="dataset.documentId || dataset.id" variant="outline">{{ dataset.title || dataset.Title || dataset.id }}</UBadge>
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

import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchAppPreviewById, publishApp, API_BASE_URL as API_URL } from '~/services/api'

const route = useRoute()
const toast = useToast()
const API_BASE_URL = API_URL

const app = ref(null)
const loading = ref(true)
const error = ref(null)
const viewMode = ref('desktop')
const publishing = ref(false)

const handlePublish = async () => {
  publishing.value = true
  try { await publishApp(route.params.id); toast.add({ title: 'App published successfully!', color: 'green' }) }
  catch (err) { toast.add({ title: `Failed to publish: ${err.message}`, color: 'red' }) }
  finally { publishing.value = false }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const resolveImageUrl = (img) => {
  if (!img?.url) return ''
  return img.url.startsWith('/') ? `${API_BASE_URL}${img.url}` : img.url
}

const normalizeApp = (data) => {
  const d = { ...data }
  if (!Array.isArray(d.articles)) d.articles = []
  if (!Array.isArray(d.datasets)) d.datasets = []
  if (!Array.isArray(d.contributors)) d.contributors = []
  if (Array.isArray(d.image)) d.image = d.image[0] || null
  return d
}

const loadApp = async () => {
  loading.value = true; error.value = null
  try { app.value = normalizeApp(await fetchAppPreviewById(route.params.id)) }
  catch (err) { error.value = `Failed to load app: ${err.message}` }
  finally { loading.value = false }
}

onMounted(() => { loadApp() })
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
