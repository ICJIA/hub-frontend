<template>
  <div class="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-6">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm text-gray-500 dark:text-gray-400 font-medium">Filter by:</span>
      <USelect
        :model-value="topic"
        :items="[{ label: 'All Topics', value: null }, ...availableTopics.map(t => ({ label: t, value: t }))]"
        size="sm"
        class="w-40"
        @update:model-value="val => { $emit('update:topic', val); $emit('change') }"
      />
      <USelect placeholder="All Centers" size="sm" class="w-36" disabled />
      <USelect
        v-if="showAuthorFilter"
        :model-value="author"
        :items="[{ label: 'All Authors', value: null }, ...availableAuthors.map(a => ({ label: a, value: a }))]"
        size="sm"
        class="w-40"
        @update:model-value="val => { $emit('update:author', val); $emit('change') }"
      />
      <USelect v-else placeholder="All Authors" size="sm" class="w-40" disabled />
      <USelect
        :model-value="year"
        :items="[{ label: 'All Years', value: null }, ...availableYears.map(y => ({ label: y, value: y }))]"
        size="sm"
        class="w-28"
        @update:model-value="val => { $emit('update:year', val); $emit('change') }"
      />
      <div class="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        <button
          :class="['px-2 py-1 text-sm', viewMode === 'grid' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600']"
          @click="$emit('update:viewMode', 'grid')"
        >
          <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4" />
        </button>
        <button
          :class="['px-2 py-1 text-sm border-l border-gray-300 dark:border-gray-600', viewMode === 'list' ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600']"
          @click="$emit('update:viewMode', 'list')"
        >
          <UIcon name="i-heroicons-list-bullet" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  availableTopics: { type: Array, default: () => [] },
  availableAuthors: { type: Array, default: () => [] },
  availableYears: { type: Array, default: () => [] },
  topic: { type: String, default: null },
  author: { type: String, default: null },
  year: { type: String, default: null },
  viewMode: { type: String, default: 'grid' },
  showAuthorFilter: { type: Boolean, default: true }
})

defineEmits(['update:topic', 'update:author', 'update:year', 'update:viewMode', 'change'])
</script>
