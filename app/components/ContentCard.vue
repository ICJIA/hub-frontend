<template>
  <div
    class="bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow h-full"
    :class="imageUrl && viewMode === 'list' ? 'flex' : ''"
    @click="$emit('click')"
  >
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="title"
      :class="viewMode === 'list' ? 'w-44 min-w-[180px] object-cover' : 'w-full h-48 object-cover'"
    />
    <div
      v-else-if="showPlaceholder"
      class="flex items-center justify-center bg-purple-300"
      :style="viewMode === 'list' ? 'width:180px;min-width:180px' : 'height:200px'"
    >
      <span class="text-white text-sm">No Image</span>
    </div>
    <div class="p-4">
      <div class="text-lg font-semibold mb-1 leading-snug">{{ title }}</div>
      <div v-if="date" class="text-xs text-gray-500 mb-2">{{ formatDate(date) }}</div>
      <p v-if="description" class="text-sm text-gray-500 mb-3">{{ truncate(description, 150) }}</p>
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
defineProps({
  title: { type: String, required: true },
  date: { type: String, default: null },
  description: { type: String, default: null },
  categories: { type: Array, default: () => [] },
  imageUrl: { type: String, default: null },
  viewMode: { type: String, default: 'grid' },
  showPlaceholder: { type: Boolean, default: true }
})

defineEmits(['click'])
</script>
