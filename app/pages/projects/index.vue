<template>
  <div>
    <!-- ══════════════════════════════════════════════════
         1. HERO — dark navy, full-width
    ═══════════════════════════════════════════════════ -->
    <div class="text-white bg-[#1a3a5c] min-h-[200px]">
      <div class="max-w-[1400px] mx-auto px-6 py-12 flex items-center">
        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-3 leading-tight">Projects</h1>
          <p class="text-white text-base max-w-2xl leading-relaxed">
            Through major statewide projects and strategic partnerships, ICJIA's Research &amp; Analysis Unit
            modernizes Illinois's justice system by integrating rigorous data infrastructure with policy innovation
            to improve transparency and performance.
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center py-20 bg-white dark:bg-gray-950">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
      <p class="mt-4 text-gray-500">Loading page...</p>
    </div>

    <template v-else>

      <UAlert
        v-if="pageError"
        color="warning"
        icon="i-lucide-triangle-alert"
        title="Could not load page content from Strapi"
        :description="pageError.message"
        class="mx-4 mt-4"
      />

      <!-- ══════════════════════════════════════════════════
           2. MAJOR PROJECTS — carousel
      ═══════════════════════════════════════════════════ -->
      <div class="bg-gray-50 dark:bg-gray-900 py-10">
        <div class="max-w-[1400px] mx-auto px-4">
          <!-- Header -->
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-lg bg-[#1a3a5c] flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-white" />
            </div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ currentPage.projectsTitle }}</h2>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">{{ currentPage.projectsSubtitle }}</p>

          <!-- Carousel -->
          <UCarousel
            ref="projectsCarouselRef"
            :items="currentPage.projects || []"
            arrows
            :options="{ duration: 25 }"
            :ui="{
              item: 'basis-[420px]',
              container: 'gap-5',
            }"
          >
            <template #prev="{ onClick }">
              <UButton
                v-if="!carouselAtStart"
                icon="i-lucide-chevron-left"
                color="white"
                variant="solid"
                size="md"
                class="rounded-full shadow"
                @click="onClick"
              />
            </template>
            <template #next="{ onClick }">
              <UButton
                icon="i-lucide-chevron-right"
                color="white"
                variant="solid"
                size="md"
                class="rounded-full shadow"
                @click="onClick"
              />
            </template>
            <template #default="{ item: project }">
              <div class="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
                <!-- Coloured header -->
                <div class="p-5 flex flex-col justify-between min-h-[160px]" :class="project.headerBg">
                  <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <UIcon :name="project.icon || 'i-lucide-folder'" class="w-5 h-5 text-white" />
                  </div>
                  <div class="mt-4">
                    <h3 class="font-bold text-white text-base leading-snug mb-2">{{ project.title }}</h3>
                    <span class="inline-block text-xs text-white/90 bg-white/20 rounded-full px-3 py-0.5">{{ project.category }}</span>
                  </div>
                </div>
                <!-- White body -->
                <div class="p-5 flex flex-col flex-1">
                  <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{{ project.description }}</p>
                  <ul class="space-y-2 flex-1 mb-5">
                    <li v-for="bullet in project.bullets" :key="bullet" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <UIcon name="i-lucide-check-circle-2" class="w-4 h-4 text-green-600 shrink-0" />
                      <span>{{ bullet }}</span>
                    </li>
                  </ul>
                  <div class="flex justify-end">
                    <UButton :to="project.url || currentPage.projectLearnMoreUrl" variant="outline" color="gray" size="sm" class="border border-gray-200 dark:border-gray-600">{{ currentPage.projectLearnMoreLabel }}</UButton>
                  </div>
                </div>
              </div>
            </template>
          </UCarousel>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
defineRouteRules({ prerender: true })

import { ref, computed, watch } from 'vue'

const PAGE_SLUG = 'test'

const MOCK = {
  projectLearnMoreLabel: 'Learn More',
  projectLearnMoreUrl: '#',
  projectsTitle: 'Major Projects in R&A',
  projectsSubtitle: 'There are five centers in R&A that focus on different areas of the criminal justice system. Click the tiles to the left to get an overview of the centers and their research.',
}

useSeoMeta({
  title: 'Projects | ICJIA Research Hub',
  description: "ICJIA's Research & Analysis Unit major statewide projects including Justice Counts, InfoNet, and the IDHS Deflection Initiative.",
  ogTitle: 'Projects | ICJIA Research Hub',
  ogDescription: "ICJIA's Research & Analysis Unit major statewide projects including Justice Counts, InfoNet, and the IDHS Deflection Initiative.",
})

const { fetchPageBySlug } = usePages()

const { data: page, pending: isLoading, error: pageError } = await useAsyncData(
  'projects-page',
  () => fetchPageBySlug(PAGE_SLUG)
)

const currentPage = computed(() => {
  try {
    const merged = { ...MOCK, ...(page.value || {}) }
    if (Array.isArray(merged.projects)) merged.projects = merged.projects.filter(Boolean)
    const componentFields = ['projectLearnMoreLabel', 'projectLearnMoreUrl']
    for (const field of componentFields) {
      const raw = page.value?.[field]
      if (Array.isArray(raw) && raw[0]?.[field]) merged[field] = raw[0][field]
    }
    return merged
  } catch (e) {
    console.error('[currentPage]', e)
    return MOCK
  }
})

const projectsCarouselRef = ref(null)
const carouselAtStart = ref(true)

watch(projectsCarouselRef, (carousel) => {
  if (!carousel) return
  const embla = carousel.emblaApi
  if (!embla) return
  carouselAtStart.value = !embla.canScrollPrev()
  embla.on('select', () => {
    carouselAtStart.value = !embla.canScrollPrev()
  })
}, { flush: 'post' })
</script>
