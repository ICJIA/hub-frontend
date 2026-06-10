<template>
  <div class="max-w-[1400px] mx-auto px-4 py-6">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold">Research Articles</h1>
    </div>

    <CategoryChips
      :categories="categoryCounts"
      :total="allItems.length"
    />

    <ContentFilterBar
      v-model:topic="filterTopic"
      v-model:author="filterAuthor"
      v-model:year="filterYear"
      v-model:search="filterSearch"
      v-model:view-mode="viewMode"
      :available-topics="availableTopics"
      :available-authors="availableAuthors"
      :available-years="availableYears"
    />

    <UAlert
      v-if="loadError"
      color="warning"
      icon="i-lucide-triangle-alert"
      :description="loadError"
      class="mb-4"
    />

    <div v-else-if="isLoading" class="flex flex-col items-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
      <p class="mt-4 text-gray-500">Loading articles...</p>
    </div>

    <template v-else>
      <div v-if="paginatedItems.length > 0" class="grid grid-cols-12 gap-4">
        <div
          v-for="item in paginatedItems"
          :key="item.slug"
          :class="viewMode === 'list' ? 'col-span-12' : 'col-span-12 sm:col-span-6 md:col-span-4'"
        >
          <ContentCard
            :title="item.title"
            :date="item.date"
            :description="item.summary"
            :categories="item.categories"
            :image-url="item.imageUrl || null"
            :view-mode="viewMode"
            :query="filterSearch || undefined"
            :files="item.files || []"
            :matched-files="fileMatchesBySlug.get(item.slug) || []"
            @click="goToArticle(item.slug)"
            @file-click="navigateFile"
          />
        </div>
      </div>

      <div v-else class="text-center py-16 text-gray-500">
        <p>No articles found.</p>
      </div>

      <div v-if="totalFiltered > pageSize" class="flex justify-center mt-6">
        <UPagination
          :page="currentPage"
          :total="totalFiltered"
          :items-per-page="pageSize"
          @update:page="changePage"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
defineRouteRules({ prerender: true })

import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const navFrom = useState('nav:article-from', () => null)
const navSearchQuery = useState('nav:search-query', () => '')
const { loadIndex, searchByType, getByType, isLoaded, isLoading, loadError } = useSearch()
const { load: loadPagefind, search: pagefindSearch, isLoaded: pagefindLoaded } = usePagefind()

useSeoMeta({
  title: 'Articles | ICJIA Research Hub',
  description: 'Browse criminal justice research articles from the ICJIA Research and Analysis Unit.',
  ogTitle: 'Articles | ICJIA Research Hub',
  ogDescription: 'Browse criminal justice research articles from the ICJIA Research and Analysis Unit.',
})

// Initialize from URL so topic clicks from Research Hub and shared links work
const filterTopic = ref(route.query.topic || null)
const filterAuthor = ref(route.query.author || null)
const filterYear = ref(route.query.year || null)
const filterSearch = ref(Array.isArray(route.query.search) ? route.query.search[0] ?? '' : route.query.search ?? '')
const viewMode = ref('grid')
const currentPage = ref(Number(route.query.page) || 1)
const pageSize = 12

const allItems = computed(() => getByType('article'))

const availableTopics = computed(() =>
  [...new Set(allItems.value.flatMap(i => i.categories))].filter(Boolean).sort()
)

const categoryCounts = computed(() => {
  const counts = {}
  for (const item of allItems.value) {
    for (const cat of item.categories ?? []) {
      if (cat) counts[cat] = (counts[cat] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
})

const availableAuthors = computed(() =>
  [...new Set(allItems.value.flatMap(i => i.authors))].filter(Boolean).sort()
)

const availableYears = computed(() => {
  const years = new Set(
    allItems.value
      .map(i => {
        const y = new Date(i.date).getFullYear()
        return Number.isFinite(y) ? String(y) : null
      })
      .filter(Boolean)
  )
  return [...years].sort((a, b) => Number(b) - Number(a))
})

// Pagefind results (file matches inside PDFs/Excel attached to articles).
// Populated client-side once pagefind has loaded; empty otherwise so the page
// still works during prerender / before the engine is ready.
const pagefindResults = ref([])
let pagefindSeq = 0

const runPagefind = async (q) => {
  const trimmed = q.trim()
  const seq = ++pagefindSeq
  if (!trimmed || !pagefindLoaded.value) {
    pagefindResults.value = []
    return
  }
  const results = await pagefindSearch(trimmed)
  if (seq === pagefindSeq) pagefindResults.value = results
}

// Re-run when the query changes OR when pagefind finishes loading
watch([filterSearch, pagefindLoaded], ([q]) => runPagefind(q), { immediate: true })

// Reverse lookup: file hash → article slug, built from the search index.
// Used as a fallback when file-parents.json is missing or empty.
const fileHashToSlug = computed(() => {
  const map = new Map()
  for (const item of allItems.value) {
    for (const f of item.files ?? []) {
      if (f.hash) map.set(f.hash, item.slug)
    }
  }
  return map
})

const hashFromUrl = (url) =>
  (url?.split('/').pop() ?? '').replace(/\.(pdf|html)$/i, '')

// slug → pagefind file results for that article (used to mark "contains match").
// Primary source: parents from file-parents.json. Fallback: hash reverse-lookup
// from the search index so results still surface when file-parents.json is absent.
const fileMatchesBySlug = computed(() => {
  const map = new Map()
  for (const r of pagefindResults.value) {
    if (r.type !== 'file') continue
    const slugs = new Set()
    if (r.parents?.length) {
      for (const p of r.parents) {
        if (p.type === 'article') slugs.add(p.slug)
      }
    }
    if (slugs.size === 0) {
      const slug = fileHashToSlug.value.get(hashFromUrl(r.url))
      if (slug) slugs.add(slug)
    }
    for (const slug of slugs) {
      if (!map.has(slug)) map.set(slug, [])
      map.get(slug).push(r)
    }
  }
  return map
})

// Articles where pagefind matched either body content or an attached file
const pagefindMatchedSlugs = computed(() => {
  const slugs = new Set()
  for (const r of pagefindResults.value) {
    if (r.type === 'article' && r.slug) slugs.add(r.slug)
    if (r.type === 'file') {
      if (r.parents?.length) {
        for (const p of r.parents) if (p.type === 'article') slugs.add(p.slug)
      } else {
        const slug = fileHashToSlug.value.get(hashFromUrl(r.url))
        if (slug) slugs.add(slug)
      }
    }
  }
  return slugs
})

// Union text-filter results with articles that only pagefind matched (e.g. term
// lives only in an attached PDF). Empty query falls back to all articles.
const searchResults = computed(() => {
  const textResults = searchByType(filterSearch.value, 'article')
  if (!filterSearch.value.trim()) return textResults

  const bySlug = new Map(textResults.map(r => [r.slug, r]))
  for (const slug of pagefindMatchedSlugs.value) {
    if (bySlug.has(slug)) continue
    const article = allItems.value.find(a => a.slug === slug)
    if (article) bySlug.set(slug, article)
  }
  return [...bySlug.values()]
})

const filteredItems = computed(() =>
  searchResults.value.filter(item => {
    if (filterTopic.value && !item.categories.includes(filterTopic.value)) return false
    if (filterAuthor.value && !item.authors.includes(filterAuthor.value)) return false
    if (filterYear.value && String(new Date(item.date).getFullYear()) !== filterYear.value) return false
    return true
  })
)

const totalFiltered = computed(() => filteredItems.value.length)

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredItems.value.slice(start, start + pageSize)
})

// Reset to page 1 when any filter changes
watch([filterSearch, filterTopic, filterAuthor, filterYear], () => {
  currentPage.value = 1
})

// Sync filters → URL so filtered views are shareable / deep-linkable
watch([filterTopic, filterAuthor, filterYear, filterSearch, currentPage], () => {
  const query = {}
  if (filterTopic.value) query.topic = filterTopic.value
  if (filterAuthor.value) query.author = filterAuthor.value
  if (filterYear.value) query.year = filterYear.value
  if (filterSearch.value) query.search = filterSearch.value
  if (currentPage.value > 1) query.page = String(currentPage.value)
  router.replace({ query })
})

// Sync URL → filters for back/forward navigation and external links
watch(() => route.query, (q) => {
  if ((q.topic || null) !== filterTopic.value) filterTopic.value = q.topic || null
  if ((q.author || null) !== filterAuthor.value) filterAuthor.value = q.author || null
  if ((q.year || null) !== filterYear.value) filterYear.value = q.year || null
  if ((q.search || '') !== filterSearch.value) filterSearch.value = q.search || ''
  const p = Number(q.page || 1)
  if (p !== currentPage.value) currentPage.value = p
})

const changePage = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToArticle = (slug) => {
  navFrom.value = 'articles'
  navSearchQuery.value = filterSearch.value
  router.push(`/articles/${slug}`)
}

// PDF clicks open the in-app viewer with the current query so matches highlight.
// Excel/CSV opens the file directly in a new tab.
const navigateFile = (file) => {
  if (file.fileType === 'pdf') {
    router.push({
      path: '/pdf-viewer',
      query: {
        file: file.fileUrl,
        ...(filterSearch.value.trim() ? { q: filterSearch.value.trim() } : {})
      }
    })
  } else {
    window.open(file.fileUrl, '_blank', 'noopener,noreferrer')
  }
}

useAsyncData('search-index', () => loadIndex(), { server: false })
useAsyncData('articles-pagefind', () => loadPagefind(), { server: false })
</script>
