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
           2. ABOUT — icon + title + body paragraphs
      ═══════════════════════════════════════════════════ -->
      <div class="bg-gray-50 dark:bg-gray-900 py-10">
        <div class="max-w-[1400px] mx-auto px-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-9 h-9 rounded-lg bg-[#1a3a5c] flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-building-2" class="w-5 h-5 text-white" />
            </div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ currentPage.sectionTitle }}</h2>
          </div>

          <p v-if="currentPage.subtitle" class="text-gray-700 dark:text-gray-300 text-base leading-relaxed max-w-4xl">
            {{ currentPage.subtitle }}
          </p>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════
           3. SPECIALIZED CENTERS GRID
      ═══════════════════════════════════════════════════ -->
      <div class="bg-white dark:bg-gray-950 py-12">
        <div class="max-w-[1400px] mx-auto px-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Our Specialized Centers</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">
            We analyze data to better inform the community of Criminal Justice activities.
          </p>

          <div v-if="centersLoading" class="flex items-center gap-2 py-8 text-gray-500">
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
            <span class="text-sm">Loading centers…</span>
          </div>

          <UAlert
            v-else-if="centersError"
            color="warning"
            icon="i-lucide-triangle-alert"
            title="Could not load centers from Strapi"
            :description="centersError.message"
            class="mb-4"
          />

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="(center, index) in centers"
              :key="center.id"
              class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col"
            >
              <!-- Image with overlay label -->
              <div class="relative h-44 shrink-0">
                <div class="w-full h-full" :style="{ background: placeholderBgs[index % placeholderBgs.length] }" />
                <!-- Name + manager overlay at bottom of image -->
                <div class="absolute bottom-0 left-0 right-0 bg-[#1a3a5c]/80 px-3 py-2">
                  <span class="text-white text-sm font-semibold leading-snug block">{{ center.name }}</span>
                  <span class="text-white/80 text-xs">{{ center.manager }}</span>
                </div>
              </div>

              <!-- Card body -->
              <div class="p-4 flex flex-col flex-1">
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 mb-4">
                  {{ center.description }}
                </p>
                <div class="flex justify-center mt-auto">
                  <UButton
                    variant="outline"
                    color="gray"
                    size="sm"
                    class="w-28"
                    @click="openModal(center)"
                  >
                    View
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- Center detail modal -->
    <UModal v-model:open="modalOpen" :title="selectedCenter?.name" :description="selectedCenter?.manager">
      <template #body>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {{ selectedCenter?.description }}
        </p>
      </template>
    </UModal>
  </div>
</template>

<script setup>
defineRouteRules({ prerender: true })

const FALLBACK = {
  heroTitle: 'Centers',
  heroSubtitle: "The ICJIA's Research & Analysis Unit operates specialized centers that provide data-driven insights and program evaluations to guide evidence-based policy, funding decisions, and legislative reform across Illinois's justice system.",
  sectionTitle: 'Centers in Research & Analysis',
}

const placeholderBgs = [
  'linear-gradient(135deg, #2d4a6e 0%, #1a3a5c 100%)',
  'linear-gradient(135deg, #3a5a7e 0%, #1a3a5c 100%)',
  'linear-gradient(135deg, #4a6a8e 0%, #1a3a5c 100%)',
]

const { fetchCenterHome, fetchCenters } = useCenters()

const { data: page, pending: isLoading, error: pageError } = await useAsyncData(
  'centers-page',
  () => fetchCenterHome()
)

const { data: centers, pending: centersLoading, error: centersError } = await useAsyncData(
  'centers-list',
  () => fetchCenters()
)

const currentPage = computed(() => ({ ...FALLBACK, ...(page.value || {}) }))

// Modal state
const selectedCenter = ref(null)
const modalOpen = computed({
  get: () => selectedCenter.value !== null,
  set: (val) => { if (!val) selectedCenter.value = null },
})

function openModal(center) {
  selectedCenter.value = center
}

useSeoMeta({
  title: computed(() => `${currentPage.value.heroTitle} | ICJIA Research Hub`),
  description: computed(() => currentPage.value.heroSubtitle),
  ogTitle: computed(() => `${currentPage.value.heroTitle} | ICJIA Research Hub`),
  ogDescription: computed(() => currentPage.value.heroSubtitle),
})
</script>
