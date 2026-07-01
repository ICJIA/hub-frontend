<template>
  <div class="min-h-screen flex flex-col">
    <!-- Preview Header Bar -->
    <header class="sticky top-0 z-50 bg-[#1a1a2e] h-14 flex items-center px-4 shadow-lg">
      <div class="flex items-center justify-center gap-5 flex-wrap w-full">
        <span class="text-xs text-gray-400 uppercase font-medium tracking-wide">Project Preview</span>
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
            <div v-else-if="project" class="p-4">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
                  <UIcon :name="project.Icon || 'i-lucide-folder'" class="w-4 h-4 text-white" />
                </div>
                <h1 class="text-lg font-bold leading-tight">{{ project.Title }}</h1>
              </div>
              <p v-if="project.SubTitle" class="text-xs text-gray-500 mb-4">{{ project.SubTitle }}</p>
              <div v-for="(paragraph, i) in bodyParagraphs" :key="i" class="text-sm text-gray-700 leading-relaxed mb-3">{{ paragraph }}</div>
              <div v-if="project.Authors?.length" class="pt-2 text-sm">
                <span class="font-bold">Project Manager:</span>
                <span class="text-gray-700 ml-1">{{ project.Authors.join(', ') }}</span>
              </div>
              <div v-if="project.publications?.length" class="mt-4 p-3 bg-gray-100 rounded">
                <p class="text-xs font-bold mb-2">Related Publications</p>
                <ul class="space-y-1">
                  <li v-for="pub in project.publications" :key="pub.Title" class="text-xs text-blue-600">{{ pub.Title }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="device-home-bar"></div>
        </div>
      </div>

      <!-- Desktop View -->
      <div v-else>
        <div v-if="loading" class="flex justify-center py-16 bg-gray-100">
          <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
        </div>

        <div v-else-if="error" class="text-center py-16 bg-gray-100">
          <UAlert color="error" :description="error" class="mb-4" />
        </div>

        <template v-else-if="project">
          <!-- Page Header -->
          <div class="bg-white">
            <div class="max-w-[1300px] mx-auto px-4 sm:px-6 pt-6 pb-5">
              <div class="flex items-start gap-4">
                <div class="w-11 h-11 rounded-lg bg-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                  <UIcon :name="project.Icon || 'i-lucide-folder'" class="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{{ project.Title }}</h1>
                  <p class="text-sm text-gray-500 mt-1">{{ project.SubTitle }}</p>
                </div>
              </div>
            </div>
            <div class="h-[1px] w-full bg-gray-200" />
          </div>

          <!-- Main Content -->
          <div class="flex-1 bg-gray-50">
            <div class="max-w-[1300px] mx-auto px-4 sm:px-6 py-8">
              <div class="flex flex-col gap-6 lg:flex-row lg:items-start">

                <!-- Left: Body Content -->
                <div class="flex-1 min-w-0 space-y-6">
                  <div
                    v-for="(paragraph, i) in bodyParagraphs"
                    :key="i"
                    class="text-gray-700 leading-relaxed text-[15px]"
                  >
                    {{ paragraph }}
                  </div>

                  <div v-if="project.Authors?.length" class="pt-2">
                    <span class="font-bold text-gray-900">Project Manager:</span>
                    <span class="text-gray-700 ml-1">{{ project.Authors.join(', ') }}</span>
                  </div>
                </div>

                <!-- Right: Sidebar -->
                <div class="w-full lg:w-[280px] lg:flex-shrink-0 space-y-4">

                  <!-- All Projects nav -->
                  <div v-if="allProjects.length" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <h4 class="font-bold text-gray-800 mb-3">Major Projects in R&amp;A</h4>
                    <ul class="space-y-1.5">
                      <li v-for="p in allProjects" :key="p.id">
                        <span
                          class="block text-sm leading-snug py-0.5"
                          :class="p.id === project.id ? 'text-primary-600 font-semibold' : 'text-gray-600'"
                        >{{ p.Title }}</span>
                      </li>
                    </ul>
                  </div>

                  <!-- Related Publications -->
                  <div v-if="publications.length" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <h4 class="font-bold text-gray-800 mb-3">Related Publications</h4>
                    <ul class="space-y-3">
                      <li v-for="pub in publications.slice(0, visiblePubCount)" :key="pub.Title">
                        <a :href="pub.url || '#'" class="block text-sm text-gray-700 hover:text-primary-600 leading-snug transition-colors">
                          {{ pub.Title }}
                        </a>
                        <span v-if="pub.date" class="text-xs text-gray-400">{{ pub.date }}</span>
                      </li>
                    </ul>
                    <button
                      v-if="publications.length > visiblePubCount"
                      class="mt-3 text-xs text-primary-600 hover:underline font-medium"
                      @click="visiblePubCount += 4"
                    >Load More</button>
                  </div>

                  <!-- View Published -->
                  <button @click="viewPublishedProject" class="w-full bg-primary-500 text-white py-2.5 rounded font-medium hover:bg-blue-800 transition-colors cursor-pointer">
                    View Published Project
                  </button>
                </div>

              </div>
            </div>
          </div>

          <!-- Related Resources -->
          <div v-if="resources.length" class="bg-white border-t border-gray-200">
            <div class="max-w-[1300px] mx-auto px-4 sm:px-6 py-8">
              <h2 class="text-xl font-bold text-gray-900 mb-5">Related Resources</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="resource in resources"
                  :key="resource.Title"
                  class="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-3"
                >
                  <h3 class="font-bold text-gray-900 text-sm leading-snug">{{ resource.Title }}</h3>
                  <p class="text-sm text-gray-600 leading-relaxed flex-1">{{ resource.Description }}</p>
                  <div>
                    <a :href="resource.pdfUrl || '#'" target="_blank" rel="noopener noreferrer" class="text-sm text-primary-600 hover:underline font-medium">
                      Download PDF
                    </a>
                  </div>
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
const route = useRoute()
const router = useRouter()
const { fetchProjectPreviewById, publishProject } = useProjects()

const project = ref(null)
const allProjects = ref([])
const visiblePubCount = ref(4)

const handlePublish = createPublishHandler(publishProject, 'Project published successfully!')

const bodyParagraphs = computed(() => {
  const body = project.value?.Body
  if (!body) return []
  if (Array.isArray(body)) {
    return body.map(b => typeof b === 'string' ? b : (b.text ?? b.children?.[0]?.text ?? '')).filter(Boolean)
  }
  return String(body).split(/\n\n|\n/).map(s => s.trim()).filter(Boolean)
})

const publications = computed(() => {
  const pubs = project.value?.publications
  if (!Array.isArray(pubs)) return []
  return pubs.map(p => ({
    Title: p.Title ?? p.title ?? '',
    date: p.date ?? '',
    url: p.url ?? (p.slug ? `/articles/${p.slug}` : '#')
  }))
})

const resources = computed(() => {
  const res = project.value?.resources
  if (!Array.isArray(res)) return []
  return res.map(r => ({
    Title: r.Title ?? r.title ?? '',
    Description: r.Description ?? r.description ?? '',
    pdfUrl: r.pdfUrl ?? r.url ?? '#'
  }))
})

const viewPublishedProject = () => {
  const slug = project.value?.slug
  if (slug) router.push(`/projects/${slug}`)
}

const loadAllProjects = async () => {
  try {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status') || 'draft'
    const response = await fetch(
      `${STRAPI_PROXY}/projects?status=${status}&sort=Title:asc&pagination[pageSize]=100`,
      { headers: getHeadersWithAuth() }
    )
    if (!response.ok) return
    const data = await response.json()
    allProjects.value = data.data || []
  } catch {
    // Sidebar nav is optional
  }
}

const loadProject = async () => {
  loading.value = true
  error.value = null
  try {
    project.value = await fetchProjectPreviewById(route.params.id)
    await loadAllProjects()
  } catch (err) {
    error.value = `Failed to load project: ${err.message}`
  } finally {
    loading.value = false
  }
}

useAsyncData(`project-readonly-${route.params.id}`, () => loadProject(), { server: false })
</script>

<style scoped>
.device-frame { width: 375px; background: #1a1a1a; border-radius: 40px; padding: 12px; box-shadow: 0 0 0 2px #333, 0 20px 50px rgba(0,0,0,0.3), inset 0 0 0 2px #000; }
.device-notch { width: 150px; height: 28px; background: #1a1a1a; border-radius: 0 0 20px 20px; margin: 0 auto; position: relative; top: -1px; z-index: 10; }
.device-screen { background: #fff; border-radius: 30px; overflow: hidden; height: 700px; overflow-y: auto; }
.device-screen::-webkit-scrollbar { width: 0; }
.device-home-bar { width: 120px; height: 5px; background: #666; border-radius: 3px; margin: 12px auto 0; }
</style>
