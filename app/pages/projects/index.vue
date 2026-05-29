<template>
  <div>
    <!-- ══════════════════════════════════════════════════
         1. HERO — dark navy, full-width
    ═══════════════════════════════════════════════════ -->
    <div class="text-white bg-[#1a3a5c] min-h-[200px]">
      <div class="max-w-[1400px] mx-auto px-6 py-12 flex items-center">
        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-3 leading-tight">{{ currentPage.heroTitle }}</h1>
          <p class="text-white text-base max-w-2xl leading-relaxed">{{ currentPage.heroSubtitle }}</p>
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
      <ProjectsCarousel :title="currentPage.projectsTitle" :subtitle="currentPage.projectsSubtitle" />

    </template>
  </div>
</template>

<script setup>
defineRouteRules({ prerender: true })

import { computed } from 'vue'

const FALLBACK = {
  heroTitle: 'Projects',
  heroSubtitle: '',
  projectsTitle: '',
  projectsSubtitle: '',
}

const { fetchProjectHome } = useProjects()

const { data: page, pending: isLoading, error: pageError } = await useAsyncData(
  'projects-page',
  () => fetchProjectHome()
)

const currentPage = computed(() => ({ ...FALLBACK, ...(page.value || {}) }))

useSeoMeta({
  title: computed(() => `${currentPage.value.heroTitle} | ICJIA Research Hub`),
  description: computed(() => currentPage.value.heroSubtitle),
  ogTitle: computed(() => `${currentPage.value.heroTitle} | ICJIA Research Hub`),
  ogDescription: computed(() => currentPage.value.heroSubtitle),
})
</script>
