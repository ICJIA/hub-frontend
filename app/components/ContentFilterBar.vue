<template>
  <div class="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-6">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">Filter by:</span>

      <USelect
        :model-value="topic"
        :items="[{ label: 'All Topics', value: null }, ...availableTopics.map(t => ({ label: t, value: t }))]"
        size="sm"
        class="w-40 shrink-0"
        @update:model-value="val => { $emit('update:topic', val); $emit('change') }"
      />

      <!-- <USelect placeholder="All Centers" size="sm" class="w-36 shrink-0" disabled /> -->

      <USelect
        v-if="showAuthorFilter"
        :model-value="author"
        :items="[{ label: 'All Authors', value: null }, ...availableAuthors.map(a => ({ label: a, value: a }))]"
        size="sm"
        class="min-w-[160px] w-auto shrink-0"
        :ui="{ content: 'w-auto min-w-[var(--reka-select-trigger-width)]' }"
        @update:model-value="val => { $emit('update:author', val); $emit('change') }"
      />
      <USelect v-else placeholder="All Authors" size="sm" class="min-w-[160px] w-auto shrink-0" disabled />

      <USelect
        :model-value="year"
        :items="[{ label: 'All Years', value: null }, ...availableYears.map(y => ({ label: y, value: y }))]"
        size="sm"
        class="w-28 shrink-0"
        @update:model-value="val => { $emit('update:year', val); $emit('change') }"
      />

      <!-- Search fills the remaining space between dropdowns and view toggle -->
      <UInput
        v-model="localSearch"
        placeholder="Search…"
        icon="i-lucide-search"
        size="sm"
        class="flex-1 min-w-[160px]"
        @keydown.escape="clearSearch"
      >
        <template v-if="localSearch" #trailing>
          <button
            type="button"
            class="flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
            @click.stop="clearSearch"
          >
            <UIcon name="i-lucide-x" class="w-4 h-4" />
          </button>
        </template>
      </UInput>

      <div class="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shrink-0">
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
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  availableTopics: { type: Array, default: () => [] },
  availableAuthors: { type: Array, default: () => [] },
  availableYears: { type: Array, default: () => [] },
  topic: { type: String, default: null },
  author: { type: String, default: null },
  year: { type: String, default: null },
  search: { type: String, default: '' },
  viewMode: { type: String, default: 'grid' },
  showAuthorFilter: { type: Boolean, default: true }
})

const emit = defineEmits(['update:topic', 'update:author', 'update:year', 'update:search', 'update:viewMode', 'change'])

// Local value keeps the input responsive; the debounced watcher delays the emit.
const localSearch = ref(props.search)
let debounceTimer = null

watch(localSearch, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => emit('update:search', val), 500)
})

// Sync inward if the parent resets the value programmatically
watch(() => props.search, (val) => {
  if (val !== localSearch.value) localSearch.value = val
})

const clearSearch = () => {
  clearTimeout(debounceTimer)
  localSearch.value = ''
  emit('update:search', '')
}

onBeforeUnmount(() => clearTimeout(debounceTimer))
</script>
