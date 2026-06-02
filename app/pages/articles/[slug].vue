<template>
  <div class="min-h-screen flex flex-col">
    <div v-if="loading" class="flex justify-center py-16 bg-gray-100 dark:bg-gray-900 flex-1">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
    </div>

    <div v-else-if="error" class="text-center py-16 bg-gray-100 dark:bg-gray-900 flex-1">
      <UAlert color="error" :description="error" class="mb-4" />
      <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack">{{ backLabel }}</UButton>
    </div>

    <template v-else-if="article">
      <!-- White header section -->
      <div class="bg-white dark:bg-gray-900">
        <div class="max-w-[1300px] mx-auto pt-4 px-4 pb-3 sm:pt-6 sm:px-6 sm:pb-4">
          <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack" class="mb-4">
            {{ backLabel }}
          </UButton>

          <!-- Title Row -->
          <div class="flex flex-col gap-3 mb-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 bg-primary-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <UIcon name="i-heroicons-document-text" class="w-6 h-6 text-white" />
              </div>
              <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight sm:text-2xl">{{ article.title }}</h1>
            </div>
            <div class="flex items-center gap-2 sm:flex-shrink-0">
              <button v-if="prevArticle" @click="navigateToArticle(prevArticle)" class="flex items-center gap-1 border border-blue-700 text-blue-700 px-3 py-2 rounded hover:bg-blue-50 text-sm font-medium">
                <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" /> Prev Article
              </button>
              <button v-if="nextArticle" @click="navigateToArticle(nextArticle)" class="flex items-center gap-1 bg-primary-500 text-white px-4 py-2 rounded hover:bg-blue-800 text-sm font-medium">
                Next Article <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Meta Row -->
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400 ml-0 sm:ml-[52px]">
            <span class="flex items-center gap-1.5">
              <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
              Last Updated: {{ formatDate(article.date) }}
            </span>
            <a href="#" class="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <UIcon name="i-heroicons-document" class="w-4 h-4" /> View PDF
            </a>
            <a href="#" class="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" /> Download PDF
            </a>
            <a href="#" class="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <UIcon name="i-heroicons-bookmark" class="w-4 h-4" /> Cite Article
            </a>
          </div>
        </div>
        <div class="h-[1px] w-full bg-gray-200 dark:bg-gray-700"></div>
      </div>

      <!-- Gray content area -->
      <div class="flex-1 bg-gray-100 dark:bg-gray-900">
        <div class="max-w-[1300px] mx-auto py-4 px-4 sm:py-6 sm:px-6">
          <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
            <!-- Main Content -->
            <div data-pagefind-body class="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <!-- Overview Card -->
              <div class="bg-white dark:bg-gray-800 rounded-tl-lg rounded-tr-lg overflow-hidden shadow-sm mb-6">
                <div class="bg-[#1a3a5c] text-white px-6 py-4">
                  <h2 class="text-lg font-bold">Overview</h2>
                  <p v-if="authorsString" class="text-sm text-blue-200 mt-1">Authors: {{ authorsString }}</p>
                </div>
                <img v-if="splashImageUrl" :src="splashImageUrl" :alt="article.title" class="w-full object-cover max-h-[450px]" />
              </div>

              <div class="p-6">
                <div v-if="article.abstract" class="mb-6">
                  <div class="flex items-center gap-2 mb-3">
                    <UIcon name="i-heroicons-information-circle" class="w-6 h-6 text-blue-700" />
                    <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100">Summary</h3>
                  </div>
                  <p class="text-gray-700 dark:text-gray-100 leading-relaxed" v-html="fixAssetUrls(article.abstract)"></p>
                </div>

                <div class="markdown-content" v-html="renderedMarkdown" @click="handleContentClick"></div>

                <div v-if="article.citation" class="mt-8">
                  <h4 class="font-bold text-gray-800 dark:text-gray-100 mb-2">Citation:</h4>
                  <p class="text-gray-700 dark:text-gray-100 text-sm leading-relaxed" v-html="fixAssetUrls(article.citation)"></p>
                </div>

                <div v-if="article.tags?.length" class="mt-6 flex items-center flex-wrap gap-2">
                  <span class="font-bold text-gray-700 dark:text-gray-100">Keywords &amp; Tags:</span>
                  <UBadge v-for="tag in article.tags" :key="tag" variant="subtle" class="mr-1">{{ tag }}</UBadge>
                </div>
              </div>
            </div>

            <!-- Right Sidebar -->
            <div data-pagefind-ignore class="w-full lg:w-[260px] lg:flex-shrink-0 space-y-4">
              <SidebarCard v-if="tocItems.length" title="Table Of Contents">
                <ol class="space-y-2">
                  <li v-for="(item, idx) in tocItems" :key="item.id" class="flex items-start gap-2">
                    <span class="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{{ idx + 1 }}.</span>
                    <a href="#" @click.prevent="scrollToSection(item.id)" class="text-sm text-blue-600 hover:underline leading-snug">{{ item.text }}</a>
                  </li>
                </ol>
              </SidebarCard>

              <SidebarCard v-if="authorArticles.length" title="More Articles from Author(s)">
                <div class="space-y-2">
                  <a v-for="a in authorArticles" :key="a.slug || a.id" href="#" @click.prevent="navigateToArticle(a)" class="block text-sm text-blue-600 hover:underline leading-snug">{{ a.title }}</a>
                </div>
              </SidebarCard>

              <SidebarCard v-if="relatedDatasets.length || relatedApps.length" title="Related Content">
                <div class="space-y-2">
                  <a v-for="d in relatedDatasets" :key="d.id" :href="`/datasets/${d.slug || d.documentId || d.id}`" class="block text-sm text-blue-600 hover:underline leading-snug">{{ d.title || d.Title }}</a>
                  <a v-for="a in relatedApps" :key="a.id" :href="`/apps/${a.slug}`" class="block text-sm text-blue-600 hover:underline leading-snug">{{ a.title || a.Title }}</a>
                </div>
              </SidebarCard>

              <SidebarCard v-if="article.funding" title="Funding Acknowledgement">
                <p class="text-sm text-gray-600 dark:text-gray-100 leading-relaxed" v-html="article.funding"></p>
              </SidebarCard>
            </div>
          </div>
        </div>
      </div>
    </template>

    <ScrollToTop />
  </div>
</template>

<script setup>
defineRouteRules({ prerender: true })

import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { marked } from 'marked'
import markedFootnote from 'marked-footnote'

if (!marked._footnotePluginAdded) {
  marked.use(markedFootnote())
  marked._footnotePluginAdded = true
}

const router = useRouter()
const route = useRoute()
const { fetchArticleBySlug, fetchArticles } = useArticles()

const { data: article, error: fetchError, pending: loading } = await useAsyncData(
  `article-${route.params.slug}`,
  () => fetchArticleBySlug(route.params.slug),
  { watch: [() => route.params.slug] }
)

const error = computed(() => fetchError.value ? `Failed to load article: ${fetchError.value.message}` : null)

const prevArticle = ref(null)
const nextArticle = ref(null)
const authorArticles = ref([])

const splashImageUrl = computed(() => {
  if (!article.value?.splash) return null
  if (typeof article.value.splash === 'object' && article.value.splash.url) {
    if (article.value.splash.url.startsWith('/')) return `${API_BASE_URL}${article.value.splash.url}`
    return article.value.splash.url
  }
  if (typeof article.value.splash === 'string') return article.value.splash
  return null
})

const authorsString = computed(() => article.value?.authors?.map(a => a.title).join(', ') || '')

useSeoMeta({
  title: () => article.value?.title ? `${article.value.title} | ICJIA Research Hub` : 'Article | ICJIA Research Hub',
  description: () => article.value?.abstract || 'Criminal justice research from the ICJIA Research and Analysis Unit.',
  ogTitle: () => article.value?.title || 'ICJIA Research Hub',
  ogDescription: () => article.value?.abstract || 'Criminal justice research from the ICJIA Research and Analysis Unit.',
  ogImage: () => splashImageUrl.value || '',
  twitterCard: 'summary_large_image',
})

const relatedDatasets = computed(() => {
  const d = article.value?.datasets
  return Array.isArray(d) ? d : []
})

const relatedApps = computed(() => {
  const a = article.value?.apps
  return Array.isArray(a) ? a : []
})

const fixAssetUrls = (html) => {
  if (!html) return html
  return html.replace(/(src=["'])(\/[^"']*["'])/g, `$1${API_BASE_URL}$2`)
}

const fixFootnotes = (md) => {
  md = md.replace(/([^\n])\[\^(\d+)\]:/g, '$1\n\n[^$2]:')
  let prev
  do {
    prev = md
    md = md.replace(/(\[\^\d+\]:[^\n]*)\n(?!\[\^\d+\]:|\s*$|\n)([^\n]+)/g, '$1 $2')
  } while (md !== prev)
  return md
}

const slugify = (text) =>
  text.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim()

const tocItems = computed(() => {
  if (!article.value?.markdown) return []
  return article.value.markdown
    .split('\n')
    .filter(line => /^##\s+/.test(line))
    .map(line => {
      const text = line.replace(/^##\s+/, '').replace(/\*\*?([^*]+)\*\*?/g, '$1').replace(/`([^`]+)`/g, '$1').trim()
      return { text, id: slugify(text) }
    })
})

const scrollToSection = (id) => {
  const el = document.getElementById(id)
  if (!el) return
  const header = document.querySelector('header')
  const offset = (header?.offsetHeight ?? 0) + 16
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
}

const handleContentClick = (e) => {
  const anchor = e.target.closest('a[href^="#"]')
  if (!anchor) return
  const id = anchor.getAttribute('href').slice(1)
  const el = document.getElementById(id)
  if (!el) return
  e.preventDefault()
  const header = document.querySelector('header')
  const offset = (header?.offsetHeight ?? 0) + 16
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
}

const renderedMarkdown = computed(() => {
  if (!article.value?.markdown) return ''
  let md = fixFootnotes(article.value.markdown)
  let html = marked(md)
  html = html.replace(/ title="_blank"/g, ' target="_blank" rel="noopener noreferrer"')
  html = html.replace(/<h2>(.*?)<\/h2>/g, (_, inner) => {
    const id = slugify(inner)
    return `<h2 id="${id}">${inner}</h2>`
  })
  html = html.replace(/<table>/g, '<div class="table-wrapper"><table>')
  html = html.replace(/<\/table>/g, '</table></div>')
  return fixAssetUrls(html)
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const backLabel = computed(() => route.query.from === 'articles' ? 'Back to Articles' : 'Back to Home')
const goBack = () => route.query.from === 'articles' ? router.push('/articles') : router.push('/')

const navigateToArticle = (a) => {
  const slug = a.slug
  const from = route.query.from ? `?from=${route.query.from}` : ''
  router.push(`/articles/${slug}${from}`)
}

const loadNavigation = async () => {
  try {
    const data = await fetchArticles(1, 100, 'date:desc')
    const articles = data.data || []
    const currentSlug = route.params.slug
    const currentIndex = articles.findIndex(a =>
      a.slug === currentSlug || a.documentId === currentSlug
    )
    if (currentIndex > 0) prevArticle.value = articles[currentIndex - 1]
    if (currentIndex !== -1 && currentIndex < articles.length - 1) nextArticle.value = articles[currentIndex + 1]
  } catch (e) {
    // Navigation is optional, fail silently
  }
}

const loadAuthorArticles = async () => {
  const firstAuthor = article.value?.authors?.[0]?.title
  if (!firstAuthor) return
  try {
    const data = await fetchArticles(1, 5, 'date:desc', '', { author: firstAuthor })
    const currentSlug = route.params.slug
    authorArticles.value = (data.data || [])
      .filter(a => a.slug !== currentSlug && a.documentId !== currentSlug)
      .slice(0, 3)
  } catch (e) {
    // Author articles are optional, fail silently
  }
}

watch(article, (newArticle) => {
  if (newArticle) {
    loadNavigation()
    loadAuthorArticles()
  }
}, { immediate: true })
</script>
