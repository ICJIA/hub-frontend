<template>
  <div class="min-h-screen flex flex-col">
    <div v-if="loading" class="flex justify-center py-16 bg-gray-100 dark:bg-gray-900 flex-1">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
    </div>

    <div v-else-if="error" class="text-center py-16 bg-gray-100 dark:bg-gray-900 flex-1">
      <UAlert color="error" :description="error" class="mb-4" />
      <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack">Back to Apps</UButton>
    </div>

    <template v-else-if="app">
      <!-- White header section -->
      <div class="bg-white dark:bg-gray-900">
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
              <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight sm:text-2xl">{{ app.title }}</h1>
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
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400 ml-0 sm:ml-[52px] mb-3">
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
        <div class="h-[1px] w-full bg-gray-200 dark:bg-gray-700"></div>
      </div>

      <!-- Gray content area -->
      <div class="flex-1 bg-gray-100 dark:bg-gray-900">
        <div class="max-w-[1300px] mx-auto py-4 px-4 sm:py-6 sm:px-6">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
            <!-- Main Content -->
            <div class="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <!-- Overview Card -->
              <div class="bg-white dark:bg-gray-800 rounded-tl-lg rounded-tr-lg overflow-hidden shadow-sm mb-6">
                <div class="bg-[#1a3a5c] text-white px-6 py-4">
                  <h2 class="text-lg font-bold">Overview: {{ app.title }}</h2>
                  <p v-if="contributorsString" class="text-sm text-blue-200 mt-1">{{ contributorsString }}</p>
                </div>
                <img v-if="imageUrl" :src="imageUrl" :alt="app.title" class="w-full object-cover max-h-[450px]" />
              </div>

              <div class="p-6">
                <div v-if="app.description" class="mb-6">
                  <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-information-circle" class="w-6 h-6 text-blue-700" />
                    <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">Summary</h3>
                  </div>
                  <p class="text-gray-700 dark:text-gray-100 leading-relaxed">{{ app.description }}</p>
                </div>
              </div>
            </div>

            <!-- Right Sidebar -->
            <div class="w-full lg:w-[260px] lg:flex-shrink-0 space-y-4">
              <SidebarCard v-if="app.citation" title="Suggested Citation">
                <p class="text-sm text-gray-600 dark:text-gray-100 leading-relaxed word-break" v-html="app.citation"></p>
              </SidebarCard>

              <SidebarCard v-if="relatedArticles.length || relatedDatasets.length" title="Related Content">
                <div class="space-y-2">
                  <a
                    v-for="article in relatedArticles"
                    :key="article.slug"
                    href="#"
                    @click.prevent="goToArticle(article)"
                    class="block text-sm text-blue-600 hover:underline leading-snug"
                  >{{ article.title || article.Title }}</a>
                  <a
                    v-for="dataset in relatedDatasets"
                    :key="dataset.slug || dataset.documentId || dataset.id"
                    href="#"
                    @click.prevent="goToDataset(dataset)"
                    class="block text-sm text-blue-600 hover:underline leading-snug"
                  >{{ dataset.title || dataset.Title }}</a>
                </div>
              </SidebarCard>

              <SidebarCard v-if="app.funding" title="Funding Acknowledgement">
                <p class="text-sm text-gray-600 dark:text-gray-100 leading-relaxed" v-html="app.funding"></p>
              </SidebarCard>
            </div>
          </div>
        </div>
      </div>
    </template>

    <ScrollToTop />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const { fetchAppBySlug, getAppImageUrl } = useApps()

const { data: app, error: fetchError, pending: loading } = await useAsyncData(
  `app-${route.params.slug}`,
  async () => {
    const data = await fetchAppBySlug(route.params.slug)
    if (Array.isArray(data.image)) data.image = data.image[0] || null
    if (!Array.isArray(data.articles)) data.articles = []
    if (!Array.isArray(data.datasets)) data.datasets = []
    if (!Array.isArray(data.contributors)) data.contributors = []
    return data
  },
  { watch: [() => route.params.slug] }
)

const error = computed(() => fetchError.value ? `Failed to load app: ${fetchError.value.message}` : null)

const imageUrl = computed(() => getAppImageUrl(app.value))
const contributorsString = computed(() => app.value?.contributors?.map(c => c.title).join(', ') || '')
const relatedArticles = computed(() => app.value?.articles || [])
const relatedDatasets = computed(() => app.value?.datasets || [])

useSeoMeta({
  title: () => app.value?.title ? `${app.value.title} | ICJIA Research Hub` : 'App | ICJIA Research Hub',
  description: () => app.value?.description || 'Criminal justice app from the ICJIA Research and Analysis Unit.',
  ogTitle: () => app.value?.title || 'ICJIA Research Hub',
  ogDescription: () => app.value?.description || 'Criminal justice app from the ICJIA Research and Analysis Unit.',
  ogImage: () => imageUrl.value || '',
})

const goBack = () => router.push('/apps')
const goToArticle = (item) => router.push(`/articles/${item.slug}`)
const goToDataset = (item) => router.push(`/datasets/${item.slug}`)
</script>
