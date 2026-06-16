<template>
  <div class="min-h-screen flex flex-col">
    <!-- Preview Header Bar -->
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

    <main class="flex-1 bg-gray-100">
      <!-- Mobile Frame -->
      <div v-if="viewMode === 'mobile'" class="flex justify-center py-10 px-5">
        <div class="device-frame">
          <div class="device-notch"></div>
          <div class="device-screen">
            <div v-if="loading" class="flex flex-col items-center py-10">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-blue-500" />
            </div>
            <div v-else-if="app" class="p-4">
              <div v-if="app.image" class="mb-3">
                <img :src="resolveImageUrl(app.image)" :alt="app.title" class="w-full rounded-lg" />
              </div>
              <div v-if="app.categories?.length" class="flex flex-wrap gap-1 mb-2">
                <UBadge v-for="cat in app.categories" :key="cat" color="primary" variant="subtle" size="sm">{{ cat }}</UBadge>
              </div>
              <h1 class="text-xl font-bold mb-2" style="line-height:1.3">{{ app.title }}</h1>
              <div class="flex gap-2 mb-2 text-xs text-gray-500 flex-wrap">
                <span v-if="app.date">{{ formatDate(app.date) }}</span>
                <UBadge v-if="app.external" color="warning" variant="subtle" size="sm">External</UBadge>
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
      </div>

      <!-- Desktop View -->
      <div v-else>
        <div v-if="loading" class="flex justify-center py-16">
          <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
        </div>

        <div v-else-if="error" class="text-center py-16">
          <UAlert color="error" :description="error" class="mb-4" />
        </div>

        <template v-else-if="app">
          <!-- White header section -->
          <div class="bg-white">
            <div class="max-w-[1300px] mx-auto pt-4 px-4 pb-3 sm:pt-6 sm:px-6 sm:pb-4">
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
                    <p class="text-sm text-gray-600 leading-relaxed break-words" v-html="app.citation"></p>
                  </div>

                  <!-- Related Content -->
                  <div v-if="relatedArticles.length || relatedDatasets.length" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <h4 class="font-bold text-gray-800 mb-3">Related Content</h4>
                    <div class="space-y-2">
                      <a
                        v-for="article in relatedArticles"
                        :key="article.documentId || article.id"
                        :href="`/articles/${article.documentId || article.id}`"
                        class="block text-sm text-blue-600 hover:underline leading-snug"
                      >{{ article.title || article.Title }}</a>
                      <a
                        v-for="dataset in relatedDatasets"
                        :key="dataset.documentId || dataset.id"
                        :href="`/datasets/${dataset.documentId || dataset.id}`"
                        class="block text-sm text-blue-600 hover:underline leading-snug"
                      >{{ dataset.title || dataset.Title }}</a>
                    </div>
                  </div>

                  <!-- Funding Acknowledgement -->
                  <div v-if="app.funding" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <h4 class="font-bold text-gray-800 mb-2">Funding Acknowledgement</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-100 leading-relaxed" v-html="app.funding"></p>
                  </div>

                  <!-- View Published App -->
                  <button @click="viewPublishedApp" class="w-full bg-primary-500 text-white py-2.5 rounded font-medium hover:bg-blue-800 transition-colors cursor-pointer">
                    View Published App
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
definePageMeta({ middleware: ['preview-access'], layout: 'preview' })

const { loading, error, viewMode, publishing, createPublishHandler } = usePreviewReadonly()
const { formatDate, resolveImageUrl } = usePreviewUtils()
const route = useRoute()
const router = useRouter()
const { fetchAppPreviewById, publishApp } = useApps()

const app = ref(null)

const handlePublish = createPublishHandler(publishApp, 'App published successfully!')

const imageUrl = computed(() => {
  const img = Array.isArray(app.value?.image) ? app.value.image[0] : app.value?.image
  return resolveImageUrl(img)
})

const contributorsString = computed(() => app.value?.contributors?.map(c => c.title).join(', ') || '')
const relatedArticles = computed(() => app.value?.articles || [])
const relatedDatasets = computed(() => app.value?.datasets || [])

const viewPublishedApp = () => {
  const id = app.value?.documentId || app.value?.id
  if (id) router.push(`/apps/${id}`)
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
  loading.value = true
  error.value = null
  try { app.value = normalizeApp(await fetchAppPreviewById(route.params.id)) }
  catch (err) { error.value = `Failed to load app: ${err.message}` }
  finally { loading.value = false }
}

useAsyncData(`app-readonly-${route.params.id}`, () => loadApp(), { server: false })
</script>

<style scoped>
.device-frame { width: 375px; background: #1a1a1a; border-radius: 40px; padding: 12px; box-shadow: 0 0 0 2px #333, 0 20px 50px rgba(0,0,0,0.3), inset 0 0 0 2px #000; }
.device-notch { width: 150px; height: 28px; background: #1a1a1a; border-radius: 0 0 20px 20px; margin: 0 auto; position: relative; top: -1px; z-index: 10; }
.device-screen { background: #fff; border-radius: 30px; overflow: hidden; height: 700px; overflow-y: auto; }
.device-screen::-webkit-scrollbar { width: 0; }
.device-home-bar { width: 120px; height: 5px; background: #666; border-radius: 3px; margin: 12px auto 0; }
</style>
