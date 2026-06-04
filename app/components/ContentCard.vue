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
    <div class="p-4 flex-1 min-w-0">
      <div class="text-lg font-semibold mb-1 leading-snug text-gray-900 dark:text-gray-100">
        <HighlightText :text="title" :query="query" />
      </div>
      <div v-if="date" class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ formatDate(date) }}</div>
      <p v-if="description" class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        <HighlightText :text="truncate(description, 150)" :query="query" />
      </p>
      <div v-if="categories?.length" class="flex flex-wrap gap-1">
        <UBadge
          v-for="category in categories"
          :key="category"
          color="primary"
          variant="subtle"
          size="sm"
        >{{ category }}</UBadge>
      </div>

      <!-- Attached files: only files whose contents matched the query are shown. -->
      <div
        v-if="matchedFilesList.length && query"
        class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700"
      >
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Matched file{{ matchedFilesList.length !== 1 ? 's' : '' }} ({{ matchedFilesList.length }}):
        </div>
        <ul class="space-y-2">
          <li
            v-for="file in matchedFilesList"
            :key="file.hash"
            class="flex items-start gap-2 text-sm"
          >
            <UIcon
              :name="fileIcon(file.fileType)"
              class="w-4 h-4 mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400"
            />
            <div class="flex-1 min-w-0">
              <a
                href="#"
                class="text-blue-600 dark:text-blue-400 hover:underline break-all font-semibold"
                @click.stop.prevent="$emit('file-click', file)"
              >
                <HighlightText :text="file.name" :query="query" />
              </a>
              <p
                v-if="matchFor(file.hash)?.excerpt"
                class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 [&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-700 [&_mark]:rounded-sm [&_mark]:text-inherit [&_mark]:not-italic"
                v-html="matchFor(file.hash).excerpt"
              />
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  date: { type: String, default: null },
  description: { type: String, default: null },
  categories: { type: Array, default: () => [] },
  imageUrl: { type: String, default: null },
  viewMode: { type: String, default: 'grid' },
  showPlaceholder: { type: Boolean, default: true },
  query: { type: String, default: undefined },
  /** All files attached to the parent record (article/dataset). */
  files: { type: Array, default: () => [] },
  /** Pagefind file results whose content matched the query — keyed by hash via matchFor(). */
  matchedFiles: { type: Array, default: () => [] }
})

defineEmits(['click', 'file-click'])

const imageLoaded = ref(false)
watch(() => props.imageUrl, () => { imageLoaded.value = false })

// hash-keyed lookup so the template can ask "did this file match?" cheaply.
// The pagefind file result URL is /attachments/<hash>.pdf or
// /attachments/excel/<hash>.html — strip the path + extension to get the hash.
const matchedByHash = computed(() => {
  const map = new Map()
  for (const m of props.matchedFiles ?? []) {
    const hash = (m.url?.split('/').pop() ?? '').replace(/\.(pdf|html)$/i, '')
    if (hash) map.set(hash, m)
  }
  return map
})

const matchFor = (hash) => matchedByHash.value.get(hash) ?? null
const matchedFilesList = computed(() => {
  const q = props.query?.toLowerCase().trim()
  return (props.files ?? []).filter(f =>
    matchFor(f.hash) || (q && f.name.toLowerCase().includes(q))
  )
})

const fileIcon = (fileType) => {
  if (fileType === 'pdf') return 'i-lucide-file-text'
  if (fileType === 'excel') return 'i-lucide-table-2'
  return 'i-lucide-file'
}
</script>
