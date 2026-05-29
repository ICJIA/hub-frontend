<template>
  <div class="bg-gray-50 dark:bg-gray-900 py-10">
    <div class="max-w-[1400px] mx-auto px-4">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-9 h-9 rounded-lg bg-[#1a3a5c] flex items-center justify-center shrink-0">
          <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-white" />
        </div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ title }}</h2>
      </div>
      <p v-if="subtitle" class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">{{ subtitle }}</p>

      <div v-if="pending" class="flex items-center gap-2 py-8 text-gray-500">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin" />
        <span class="text-sm">Loading projects…</span>
      </div>

      <UCarousel
        v-else
        ref="carouselRef"
        :items="projects || []"
        arrows
        :options="{ duration: 25 }"
        :ui="{ item: 'basis-[420px]', container: 'gap-5' }"
      >
        <template #prev="{ onClick }">
          <UButton
            v-if="!atStart"
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
                <span v-if="project.category" class="inline-block text-xs text-white/90 bg-white/20 rounded-full px-3 py-0.5">{{ project.category }}</span>
              </div>
            </div>
            <!-- White body -->
            <div class="p-5 flex flex-col flex-1">
              <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{{ project.description }}</p>
              <ul class="space-y-2 flex-1 mb-5">
                <li
                  v-for="bullet in project.bullets"
                  :key="bullet"
                  class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <UIcon name="i-lucide-check-circle-2" class="w-4 h-4 text-green-600 shrink-0" />
                  <span>{{ bullet }}</span>
                </li>
              </ul>
              <div class="flex justify-end">
                <UButton
                  :to="project.url"
                  variant="outline"
                  color="gray"
                  size="sm"
                  class="border border-gray-200 dark:border-gray-600"
                >Learn More</UButton>
              </div>
            </div>
          </div>
        </template>
      </UCarousel>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Major Projects in R&A' },
  subtitle: { type: String, default: '' },
})

const { fetchProjectsForCarousel } = useProjects()

const { data: projects, pending } = await useAsyncData('projects-carousel', () => fetchProjectsForCarousel())

const carouselRef = ref(null)
const atStart = ref(true)

watch(carouselRef, (carousel) => {
  if (!carousel) return
  const embla = carousel.emblaApi
  if (!embla) return
  atStart.value = !embla.canScrollPrev()
  embla.on('select', () => {
    atStart.value = !embla.canScrollPrev()
  })
}, { flush: 'post' })
</script>
