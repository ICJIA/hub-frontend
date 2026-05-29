<template>
  <div class="flex flex-wrap gap-2 mb-4">
    <NuxtLink
      :to="{ query: allQuery }"
      :class="chipClass(isAllActive)"
    >
      All ({{ total }})
    </NuxtLink>
    <NuxtLink
      v-for="cat in categories"
      :key="cat.label"
      :to="{ query: { ...baseQuery, topic: cat.label } }"
      :class="chipClass(activeCategory === cat.label)"
    >
      {{ cat.label }} ({{ cat.count }})
    </NuxtLink>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  categories: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
})

const route = useRoute()
const activeCategory = computed(() => route.query.topic || null)
const isAllActive = computed(() => !activeCategory.value)

// Preserve other query params (author, year, search) but drop topic and reset page
const baseQuery = computed(() => {
  const { topic: _topic, page: _page, ...rest } = route.query
  return rest
})

const allQuery = computed(() => {
  const { topic: _topic, page: _page, ...rest } = route.query
  return rest
})

const chipClass = (active) =>
  active
    ? 'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer bg-primary-500 text-white border border-primary-500'
    : 'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors'
</script>
