<template>
  <div
    class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow h-full"
    :class="imageUrl && viewMode === 'list' ? 'flex' : ''"
    @click="$emit('click')"
  >
    <!-- Image with lazy-load shimmer and fade-in -->
    <div
      v-if="imageUrl"
      class="relative overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0"
      :class="viewMode === 'list' ? 'w-44 min-w-[180px]' : 'w-full h-48'"
    >
      <!-- Shimmer placeholder shown until the image loads -->
      <div
        v-if="!imageLoaded"
        class="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]"
      />
      <img
        :src="imageUrl"
        :alt="title"
        loading="lazy"
        class="object-cover w-full h-full transition-opacity duration-500"
        :class="imageLoaded ? 'opacity-100' : 'opacity-0'"
        @load="imageLoaded = true"
        @error="imageLoaded = true"
      />
    </div>
    <div
      v-else-if="showPlaceholder"
      class="flex items-center justify-center bg-purple-300 shrink-0"
      :style="viewMode === 'list' ? 'width:180px;min-width:180px' : 'height:200px'"
    >
      <span class="text-white text-sm">No Image</span>
    </div>
    <div class="p-4">
      <div class="text-lg font-semibold mb-1 leading-snug text-gray-900 dark:text-gray-100">{{ title }}</div>
      <div v-if="date" class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ formatDate(date) }}</div>
      <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400 mb-3">{{ truncate(description, 150) }}</p>
      <div v-if="categories?.length" class="flex flex-wrap gap-1">
        <UBadge
          v-for="category in categories"
          :key="category"
          color="primary"
          variant="subtle"
          size="sm"
        >{{ category }}</UBadge>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  date: { type: String, default: null },
  description: { type: String, default: null },
  categories: { type: Array, default: () => [] },
  imageUrl: { type: String, default: null },
  viewMode: { type: String, default: 'grid' },
  showPlaceholder: { type: Boolean, default: true }
})

defineEmits(['click'])

const imageLoaded = ref(false)

// Reset when the image src changes (e.g. navigating between pages)
watch(() => props.imageUrl, () => { imageLoaded.value = false })
</script>
