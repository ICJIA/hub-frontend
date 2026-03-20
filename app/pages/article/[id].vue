<template>
  <div class="min-h-screen bg-gray-100">
    <div class="max-w-[1300px] mx-auto py-6 px-6">
      <div v-if="loading" class="flex justify-center py-16">
        <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
      </div>

      <div v-else-if="error" class="text-center py-16">
        <UAlert color="error" :description="error" class="mb-4" />
        <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack">Back to Articles</UButton>
      </div>

      <div v-else-if="article">
        <UButton variant="outline" icon="i-heroicons-arrow-left" @click="goBack" class="mb-6">
          Back to Articles
        </UButton>

        <!-- Title Row -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-start gap-3 flex-1 mr-4">
            <div class="w-10 h-10 bg-blue-700 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <UIcon name="i-heroicons-document-text" class="w-6 h-6 text-white" />
            </div>
            <h1 class="text-2xl font-bold text-gray-900 leading-tight">{{ article.title }}</h1>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <button v-if="prevArticle" @click="navigateToArticle(prevArticle)" class="flex items-center gap-1 border border-blue-700 text-blue-700 px-3 py-2 rounded hover:bg-blue-50 text-sm font-medium">
              <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" /> Prev Article
            </button>
            <button v-if="nextArticle" @click="navigateToArticle(nextArticle)" class="flex items-center gap-1 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 text-sm font-medium">
              Next Article <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Meta Row -->
        <div class="flex items-center gap-5 mb-6 text-sm text-gray-500 ml-[52px]">
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

        <!-- Two Column Layout -->
        <div class="flex gap-6 items-start">
          <!-- Main Content -->
          <div class="flex-1 min-w-0">
            <!-- Overview Card -->
            <div class="bg-white rounded-lg overflow-hidden shadow-sm mb-6">
              <div class="bg-[#1a3a5c] text-white px-6 py-4">
                <h2 class="text-lg font-bold">Overview</h2>
                <p v-if="authorsString" class="text-sm text-blue-200 mt-1">Authors: {{ authorsString }}</p>
              </div>
              <img v-if="splashImageUrl" :src="splashImageUrl" :alt="article.title" class="w-full object-cover max-h-[450px]" />
            </div>

            <!-- Summary -->
            <div v-if="article.abstract" class="mb-6">
              <div class="flex items-center gap-2 mb-3">
                <UIcon name="i-heroicons-information-circle" class="w-6 h-6 text-blue-700" />
                <h3 class="text-lg font-bold text-gray-800">Summary</h3>
              </div>
              <p class="text-gray-700 leading-relaxed" v-html="fixAssetUrls(article.abstract)"></p>
            </div>

            <!-- Markdown Content -->
            <div class="markdown-content" v-html="renderedMarkdown"></div>

            <!-- Citation -->
            <div v-if="article.citation" class="mt-8">
              <h4 class="font-bold text-gray-800 mb-2">Citation:</h4>
              <p class="text-gray-700 text-sm leading-relaxed" v-html="fixAssetUrls(article.citation)"></p>
            </div>

            <!-- Keywords & Tags -->
            <div v-if="article.tags?.length" class="mt-6 flex items-center flex-wrap gap-2">
              <span class="font-bold text-gray-700">Keywords &amp; Tags:</span>
              <UBadge v-for="tag in article.tags" :key="tag" variant="subtle" class="mr-1">{{ tag }}</UBadge>
            </div>
          </div>

          <!-- Right Sidebar -->
          <div class="w-[260px] flex-shrink-0 space-y-4">
            <!-- Table of Contents -->
            <div v-if="tocItems.length" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h4 class="font-bold text-gray-800 mb-3">Table Of Contents</h4>
              <ol class="space-y-2">
                <li v-for="(item, idx) in tocItems" :key="item.id" class="flex items-start gap-2">
                  <span class="text-sm text-gray-500 flex-shrink-0">{{ idx + 1 }}.</span>
                  <a href="#" @click.prevent="scrollToSection(item.id)" class="text-sm text-blue-600 hover:underline leading-snug">{{ item.text }}</a>
                </li>
              </ol>
            </div>

            <!-- More Articles from Author(s) -->
            <div v-if="authorArticles.length" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h4 class="font-bold text-gray-800 mb-3">More Articles from Author(s)</h4>
              <div class="space-y-2">
                <a v-for="a in authorArticles" :key="a.id" href="#" @click.prevent="navigateToArticle(a)" class="block text-sm text-blue-600 hover:underline leading-snug">{{ a.title }}</a>
              </div>
            </div>

            <!-- Related Content -->
            <div v-if="relatedDatasets.length || relatedApps.length" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h4 class="font-bold text-gray-800 mb-3">Related Content</h4>
              <div class="space-y-2">
                <a v-for="d in relatedDatasets" :key="d.id" :href="`/datasets/${d.documentId || d.id}`" class="block text-sm text-blue-600 hover:underline leading-snug">{{ d.title || d.Title }}</a>
                <a v-for="a in relatedApps" :key="a.id" :href="`/apps/${a.documentId || a.id}`" class="block text-sm text-blue-600 hover:underline leading-snug">{{ a.title || a.Title }}</a>
              </div>
            </div>

            <!-- Funding Acknowledgement -->
            <div v-if="article.funding" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h4 class="font-bold text-gray-800 mb-2">Funding Acknowledgement</h4>
              <p class="text-sm text-gray-600 leading-relaxed" v-html="article.funding"></p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll to top -->
    <button
      v-if="showScrollTop"
      class="fixed bottom-6 right-6 z-10 bg-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-blue-800 transition-colors"
      @click="scrollToTop"
      aria-label="Scroll to top"
    >
      <UIcon name="i-heroicons-chevron-up" class="w-5 h-5" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { marked } from 'marked'
import markedFootnote from 'marked-footnote'
import { fetchArticleById, fetchArticles, API_BASE_URL } from '~/services/api'

marked.use(markedFootnote())

const router = useRouter()
const route = useRoute()

const article = ref(null)
const loading = ref(true)
const error = ref(null)
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
  md = md.replace(/(\[\^\d+\]:[^\n]*)\n(?!\[\^\d+\]:|\s*$|\n)([^\n]+)/g, '$1 $2')
  return md
}

const slugify = (text) =>
  text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim()

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
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

const goBack = () => router.push('/')

const navigateToArticle = (a) => {
  const id = a.documentId || a.id
  router.push(`/article/${id}`)
}

const loadNavigation = async () => {
  try {
    const data = await fetchArticles(1, 100, 'date:desc')
    const articles = data.data || []
    const currentId = route.params.id
    const currentIndex = articles.findIndex(a =>
      String(a.id) === String(currentId) || a.documentId === currentId
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
    const currentId = route.params.id
    authorArticles.value = (data.data || [])
      .filter(a => String(a.id) !== String(currentId) && a.documentId !== currentId)
      .slice(0, 3)
  } catch (e) {
    // Author articles are optional, fail silently
  }
}

const loadArticle = async () => {
  loading.value = true
  error.value = null
  try {
    article.value = await fetchArticleById(route.params.id)
    await Promise.all([loadNavigation(), loadAuthorArticles()])
  } catch (err) {
    error.value = `Failed to load article: ${err.message}`
  } finally {
    loading.value = false
  }
}

const showScrollTop = ref(false)
const onScroll = () => { showScrollTop.value = window.scrollY > 300 }
const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

onMounted(() => {
  loadArticle()
  window.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.markdown-content { color: #333; line-height: 1.8; font-size: 16px; }
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4) { color: #2c3e50; margin-top: 30px; margin-bottom: 15px; }
.markdown-content :deep(p) { margin-bottom: 15px; }
.markdown-content :deep(a) { color: #3498db; text-decoration: none; word-wrap: break-word; }
.markdown-content :deep(a:hover) { text-decoration: underline; }
.markdown-content :deep(ul),
.markdown-content :deep(ol) { margin-bottom: 15px; padding-left: 25px; }
.markdown-content :deep(li) { margin-bottom: 8px; }
.markdown-content :deep(blockquote) { border-left: 4px solid #3498db; padding-left: 20px; margin: 20px 0; color: #555; font-style: italic; }
.markdown-content :deep(code) { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: 'Monaco','Menlo',monospace; font-size: 14px; }
.markdown-content :deep(pre) { background: #2d2d2d; color: #f8f8f2; padding: 20px; border-radius: 8px; overflow-x: auto; margin: 20px 0; }
.markdown-content :deep(pre code) { background: none; padding: 0; color: inherit; }
.markdown-content :deep(.table-wrapper) { overflow-x: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 24px; }
.markdown-content :deep(table) { width: 100%; border-collapse: collapse; margin: 0; }
.markdown-content :deep(thead) { background: linear-gradient(135deg, #0d6efd, #0a58ca); color: #fff; }
.markdown-content :deep(th),
.markdown-content :deep(td) { padding: 14px 16px; text-align: left; }
.markdown-content :deep(tbody tr:nth-child(even)) { background-color: #f4f8ff; }
.markdown-content :deep(tbody tr:hover) { background-color: #eaf2ff; }

/* Numbered list styling */
.markdown-content :deep(ol) {
  counter-reset: kf-counter;
  padding-left: 0;
}
.markdown-content :deep(ol > li) {
  list-style: none;
  padding-left: 0;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.markdown-content :deep(ol > li)::before {
  content: counter(kf-counter);
  counter-increment: kf-counter;
  min-width: 28px;
  height: 28px;
  background: #1a3a5c;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
