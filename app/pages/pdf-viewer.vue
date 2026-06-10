<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900">
    <!-- Sticky header -->
    <div class="sticky top-12 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="max-w-5xl mx-auto px-4 py-2 flex items-center gap-3">
        <UButton
          icon="i-lucide-arrow-left"
          variant="ghost"
          size="sm"
          aria-label="Go back"
          @click="goBack"
        />
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
            {{ fileName }}
          </p>
          <p
            v-if="searchQuery && !isLoading"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            <span v-if="matchCount > 0">{{ currentMatchDisplay }} / {{ matchCount }} match{{ matchCount !== 1 ? 'es' : '' }} for "{{ searchQuery }}"</span>
            <span v-else-if="isRendering">Searching…</span>
            <span v-else>No matches for "{{ searchQuery }}"</span>
          </p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <template v-if="matchCount > 0">
            <UButton
              icon="i-lucide-chevron-up"
              color="primary"
              variant="solid"
              size="sm"
              aria-label="Previous match"
              class="text-white"
              @click="prevMatch"
            />
            <UButton
              icon="i-lucide-chevron-down"
              color="primary"
              variant="solid"
              size="sm"
              aria-label="Next match"
              class="text-white"
              @click="nextMatch"
            />
          </template>
          <UButton
            icon="i-lucide-download"
            variant="outline"
            size="sm"
            label="Download"
            @click="downloadFile"
          />
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-24"
    >
      <div class="text-center text-gray-500 dark:text-gray-400">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-8 h-8 mx-auto mb-3 animate-spin"
        />
        <p>Loading PDF…</p>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="max-w-5xl mx-auto px-4 py-12"
    >
      <UAlert
        color="error"
        icon="i-lucide-triangle-alert"
        title="Failed to load PDF"
        :description="error"
      />
      <div class="mt-4">
        <UButton
          v-if="isFileUrlSafe"
          :to="fileUrl"
          target="_blank"
          icon="i-lucide-external-link"
          label="Open file directly"
          variant="outline"
          external
        />
      </div>
    </div>

    <!-- PDF pages -->
    <div
      v-else
      ref="containerRef"
      class="max-w-5xl mx-auto px-4 py-6"
    >
      <div
        v-for="pageNum in totalPages"
        :key="pageNum"
        :ref="pageRefCb(pageNum)"
        :data-page="pageNum"
        class="relative bg-white shadow-md mb-6 mx-auto overflow-hidden"
        :style="pageDimensions[pageNum]
          ? { width: pageDimensions[pageNum].width + 'px', height: pageDimensions[pageNum].height + 'px' }
          : { width: '100%', minHeight: '1100px' }"
      >
        <!-- Placeholder while lazy-rendering -->
        <div
          v-if="!renderedPages.has(pageNum)"
          class="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700"
        >
          <span class="text-sm text-gray-400 dark:text-gray-500">Page {{ pageNum }}</span>
        </div>

        <!-- Canvas — positioned at top-left at its natural pixel size -->
        <canvas
          :ref="canvasRefCb(pageNum)"
          class="absolute top-0 left-0 block"
        />

        <!-- Text layer overlay — pdfjs-dist 6 positions spans with % + CSS vars -->
        <div
          :ref="textLayerRefCb(pageNum)"
          class="pdfTextLayer absolute inset-0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

definePageMeta({ ssr: false })

// ─── Route / derived state ────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()

const fileUrl = computed(() => {
  const raw = route.query.file
  return Array.isArray(raw) ? (raw[0] ?? '') : String(raw ?? '')
})

const isFileUrlSafe = computed(() => {
  try {
    const { protocol } = new URL(fileUrl.value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
})

// Highlight term comes from `?q=…` (preferred) or falls back to a `#search=…`
// hash fragment so URLs shaped like Chromium's native viewer still highlight
// when opened in this in-app route.
const searchQuery = computed(() => {
  const q = String(route.query.q ?? '')
  if (q) return q
  const hash = String(route.hash ?? '')
  const match = hash.match(/[#&]search=([^&]+)/)
  return match?.[1] ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : ''
})
const fileName = computed(() => {
  const url = fileUrl.value
  if (!url) return 'Document'
  return decodeURIComponent(url.split('/').pop() ?? 'Document')
})

// ─── UI state ─────────────────────────────────────────────────────────────────
const isLoading = ref(true)
const isRendering = ref(false)
const error = ref('')
const totalPages = ref(0)

// Per-page dimensions computed from the PDF (set before rendering, drives placeholder size)
const pageDimensions = reactive<Record<number, { width: number, height: number, scale: number }>>({})

// Tracks which pages have been fully rendered
const renderedPages = reactive(new Set<number>())

// ─── Match navigation ─────────────────────────────────────────────────────────
// pageMatchCounts[i] = match count on page i+1, pre-scanned from text (no rendering).
// Gives accurate totals even before lazy pages are rendered.
const pageMatchCounts = ref<number[]>([])
const totalMatchCount = computed(() => pageMatchCounts.value.reduce((a, b) => a + b, 0))

// DOM elements from rendered pages only. Type carries page number so navigation
// can force-render a page when the target element doesn't exist yet.
const matchEls = ref<{ el: Element, page: number }[]>([])
const currentMatch = ref(-1)
// Use pre-scanned total when available; fall back to rendered count while scanning.
const matchCount = computed(() => totalMatchCount.value || matchEls.value.length)
const currentMatchDisplay = computed(() => currentMatch.value >= 0 ? currentMatch.value + 1 : 0)

function getMatchLocation(globalIdx: number): { page: number, localIndex: number } {
  let remaining = globalIdx
  for (let p = 0; p < pageMatchCounts.value.length; p++) {
    if (remaining < pageMatchCounts.value[p]) return { page: p + 1, localIndex: remaining }
    remaining -= pageMatchCounts.value[p]
  }
  return { page: -1, localIndex: -1 }
}

async function navigateTo(globalIdx: number) {
  if (!matchCount.value) return
  currentMatch.value = globalIdx
  const { page, localIndex } = getMatchLocation(globalIdx)
  if (page < 1) return

  if (!renderedPages.has(page)) {
    pageRefMap.get(page)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    await renderPage(page)
    await nextTick()
  }

  const pageEls = matchEls.value.filter(m => m.page === page).map(m => m.el)
  pageEls[localIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function nextMatch() {
  const total = matchCount.value
  if (!total) return
  await navigateTo((currentMatch.value + 1) % total)
}
async function prevMatch() {
  const total = matchCount.value
  if (!total) return
  await navigateTo((currentMatch.value - 1 + total) % total)
}

async function prescanSearchMatches(numPages: number) {
  const q = searchQuery.value.trim()
  if (!q || !_pdfDoc) return
  const terms = q.split(/\s+/).filter(t => t.length > 1)
  if (!terms.length) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDoc = _pdfDoc as any
  const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${terms.map(escRe).join('|')})`, 'gi')
  const counts: number[] = []

  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdfDoc.getPage(i)
      const content = await page.getTextContent()
      let count = 0
      for (const item of content.items as Array<{ str?: string }>) {
        if (typeof item.str === 'string') {
          const m = item.str.match(regex)
          if (m) count += m.length
        }
      }
      counts.push(count)
    } catch { counts.push(0) }
  }
  pageMatchCounts.value = counts
}

async function downloadFile() {
  if (!isFileUrlSafe.value) return
  const res = await fetch(fileUrl.value)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.value
  a.click()
  URL.revokeObjectURL(url)
}

function goBack() {
  // Prefer in-SPA history so we return to wherever the user came from
  // (article, dataset, app, search results, etc.). Vue Router sets
  // history.state.back to null on the first navigation, so we fall back to
  // the search page only when there's no previous entry.
  const hasPrevious = typeof window !== 'undefined' && window.history.state?.back != null
  if (hasPrevious) {
    router.back()
    return
  }
  const q = searchQuery.value.trim()
  router.push(q ? { path: '/search', query: { q } } : '/search')
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────
// Vue `:ref` callbacks receive Element | ComponentPublicInstance | null
type VueRefEl = Element | ComponentPublicInstance | null

const containerRef = ref<HTMLElement | null>(null)
const pageRefMap = new Map<number, HTMLElement>()
const canvasMap = new Map<number, HTMLCanvasElement>()
const textLayerMap = new Map<number, HTMLElement>()

// Factory functions so the returned callback has an explicit parameter type,
// which vue-tsc can infer without needing inline annotation in the template.
const pageRefCb = (n: number) => (el: VueRefEl) => {
  el instanceof Element ? pageRefMap.set(n, el as HTMLElement) : pageRefMap.delete(n)
}
const canvasRefCb = (n: number) => (el: VueRefEl) => {
  el instanceof Element ? canvasMap.set(n, el as HTMLCanvasElement) : canvasMap.delete(n)
}
const textLayerRefCb = (n: number) => (el: VueRefEl) => {
  el instanceof Element ? textLayerMap.set(n, el as HTMLElement) : textLayerMap.delete(n)
}

// ─── PDF rendering ────────────────────────────────────────────────────────────
let _pdfDoc: unknown = null
let _pdfjsLib: Record<string, unknown> | null = null
const _renderingPages = new Set<number>()
let _observer: IntersectionObserver | null = null

async function renderPage(pageNum: number) {
  if (_renderingPages.has(pageNum) || renderedPages.has(pageNum)) return
  _renderingPages.add(pageNum)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfDoc = _pdfDoc as any
    const pdfjsLib = _pdfjsLib as Record<string, any>
    const dims = pageDimensions[pageNum]
    if (!dims || !pdfDoc || !pdfjsLib) return

    const page = await pdfDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale: dims.scale })

    const canvas = canvasMap.get(pageNum)
    if (canvas) {
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      if (ctx) await page.render({ canvasContext: ctx, viewport }).promise
    }

    const textLayerDiv = textLayerMap.get(pageNum)
    if (textLayerDiv) {
      const textContent = await page.getTextContent()

      // pdfjs-dist 6 TextLayer positions items via % + --total-scale-factor CSS var.
      // Set the var so font sizes scale correctly with the viewport.
      textLayerDiv.style.setProperty('--total-scale-factor', String(dims.scale))
      textLayerDiv.style.setProperty('--scale-round-x', '1px')
      textLayerDiv.style.setProperty('--scale-round-y', '1px')

      const textLayer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport
      })
      await textLayer.render()

      // Highlight only the matched characters within each span. PDF text layers
      // split content one-span-per-word (or less), so we inject <mark> elements
      // around the exact matching substring rather than highlighting the whole span.
      if (searchQuery.value.trim()) {
        const escHtml = (s: string) =>
          s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        const terms = searchQuery.value.trim().split(/\s+/).filter(t => t.length > 1)
        const newMatches: { el: Element, page: number }[] = []

        if (terms.length) {
          const regex = new RegExp(
            `(${terms.map(t => escRe(escHtml(t))).join('|')})`,
            'gi'
          )
          textLayerDiv.querySelectorAll('span').forEach((span) => {
            const raw = span.textContent
            if (!raw) return
            const escaped = escHtml(raw)
            const marked = escaped.replace(regex, '<mark class="pdf-highlight">$1</mark>')
            if (marked === escaped) return
            span.innerHTML = marked
            span.querySelectorAll<Element>('mark.pdf-highlight').forEach(m => newMatches.push({ el: m, page: pageNum }))
          })
        }

        if (newMatches.length) {
          // Keep matchEls sorted by page so global index aligns with pageMatchCounts.
          matchEls.value = [...matchEls.value, ...newMatches].sort((a, b) => a.page - b.page)
          // Auto-scroll to the first match found across the whole document.
          if (currentMatch.value < 0) {
            currentMatch.value = 0
            await nextTick()
            newMatches[0]?.el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      }
    }

    renderedPages.add(pageNum)
  } finally {
    _renderingPages.delete(pageNum)
    // Mark rendering done when all visible pages are complete
    if (_renderingPages.size === 0) isRendering.value = false
  }
}

onMounted(async () => {
  if (!isFileUrlSafe.value) {
    error.value = 'No valid file URL provided.'
    isLoading.value = false
    return
  }

  try {
    // Lazy-import pdfjs-dist — client-only, avoids SSR issues
    _pdfjsLib = await import('pdfjs-dist')
    const lib = _pdfjsLib as Record<string, any>

    // Vite resolves new URL(module, import.meta.url) to a static asset URL
    lib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href

    // pdfjs-dist v6 dropped the string-shorthand — must pass { url } (or { data }).
    _pdfDoc = await lib.getDocument({ url: fileUrl.value }).promise
    const pdfDoc = _pdfDoc as any

    // Load all page dimensions concurrently (fast — just reads metadata, no rendering)
    const containerWidth = containerRef.value?.clientWidth ?? 800
    await Promise.all(
      Array.from({ length: pdfDoc.numPages }, async (_, i) => {
        const pageNum = i + 1
        const page = await pdfDoc.getPage(pageNum)
        const naturalVp = page.getViewport({ scale: 1 })
        // Fit to container with a small margin; cap at 2× for readability
        const scale = Math.min(2, (containerWidth - 32) / naturalVp.width)
        const vp = page.getViewport({ scale })
        pageDimensions[pageNum] = { width: vp.width, height: vp.height, scale }
      })
    )

    totalPages.value = pdfDoc.numPages
    isLoading.value = false
    isRendering.value = searchQuery.value.trim().length > 0

    await nextTick() // wait for page placeholder divs to mount

    // IntersectionObserver for lazy rendering — pre-loads 400px ahead of viewport
    _observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const n = parseInt((entry.target as HTMLElement).dataset.page ?? '0', 10)
            if (n > 0) renderPage(n)
          }
        }
      },
      { rootMargin: '400px' }
    )

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const el = pageRefMap.get(i)
      if (el) _observer.observe(el)
    }

    // Background text-only scan: counts matches on all pages so the header
    // shows the correct total before lazy rendering catches up.
    if (searchQuery.value.trim()) prescanSearchMatches(pdfDoc.numPages)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load PDF.'
    isLoading.value = false
  }
})

onUnmounted(() => {
  _observer?.disconnect()
  ;(_pdfDoc as any)?.destroy?.()
})
</script>

<style>
/* ─── pdfjs-dist 6 text layer ─────────────────────────────────────────────── */
.pdfTextLayer {
  color-scheme: only light;
  position: absolute;
  text-align: initial;
  inset: 0;
  overflow: clip;
  opacity: 1;
  line-height: 1;
  letter-spacing: normal;
  word-spacing: normal;
  text-size-adjust: none;
  forced-color-adjust: none;
  transform-origin: 0 0;
  caret-color: CanvasText;

  /* CSS vars consumed by TextLayer internals */
  --min-font-size: 1;
  --text-scale-factor: calc(var(--total-scale-factor, 1) * var(--min-font-size));
  --min-font-size-inv: calc(1 / var(--min-font-size));
}

.pdfTextLayer :is(span, br) {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
  user-select: text;
}

.pdfTextLayer > :not(.markedContent),
.pdfTextLayer .markedContent span:not(.markedContent) {
  z-index: 1;
  --font-height: 0;
  font-size: calc(var(--text-scale-factor) * var(--font-height));
  --scale-x: 1;
  --rotate: 0deg;
  transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
}

.pdfTextLayer .markedContent {
  display: contents;
}

/* Search term highlight — wraps only the matched characters, not the whole span */
.pdfTextLayer mark.pdf-highlight {
  background-color: rgba(255, 213, 0, 0.55);
  border-radius: 2px;
  color: transparent;
}
</style>
