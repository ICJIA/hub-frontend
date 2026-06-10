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
          <p class="font-medium text-sm truncate text-gray-900 dark:text-gray-100">{{ fileName }}</p>
          <p v-if="searchQuery && !isLoading" class="text-xs text-gray-500 dark:text-gray-400">
            <span v-if="totalMatchCount > 0">{{ currentMatchDisplay }} / {{ totalMatchCount }} match{{ totalMatchCount !== 1 ? 'es' : '' }} for "{{ searchQuery }}"</span>
            <span v-else-if="isScanning">Searching…</span>
            <span v-else>No matches for "{{ searchQuery }}"</span>
          </p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <template v-if="totalMatchCount > 0">
            <UButton icon="i-lucide-chevron-up" color="primary" variant="solid" size="sm" aria-label="Previous match" class="text-white" @click="prevMatch" />
            <UButton icon="i-lucide-chevron-down" color="primary" variant="solid" size="sm" aria-label="Next match" class="text-white" @click="nextMatch" />
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
    <div v-if="isLoading" class="flex items-center justify-center py-24">
      <div class="text-center text-gray-500 dark:text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-3 animate-spin" />
        <p>Loading PDF…</p>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="max-w-5xl mx-auto px-4 py-12">
      <UAlert
        color="error"
        icon="i-lucide-triangle-alert"
        title="Failed to load PDF"
        :description="error"
      />
      <div class="mt-4">
        <UButton :to="fileUrl" target="_blank" icon="i-lucide-external-link" label="Open file directly" variant="outline" external />
      </div>
    </div>

    <!-- PDF pages -->
    <div v-else ref="containerRef" class="max-w-5xl mx-auto px-4 py-6">
      <div
        v-for="pageNum in totalPages"
        :key="pageNum"
        :data-page="pageNum"
        :ref="pageRefCb(pageNum)"
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

const fileUrl = computed(() => String(route.query.file ?? ''))

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
const isScanning = ref(false)
const error = ref('')
const totalPages = ref(0)

const pageDimensions = reactive<Record<number, { width: number; height: number; scale: number }>>({})
const renderedPages = reactive(new Set<number>())

// ─── Match tracking ────────────────────────────────────────────────────────────
// matchCountByPage: populated by prescan before any rendering — gives stable total immediately.
// matchElsByPage:   populated as pages render; keyed by page number so iteration is always in page order.
const matchCountByPage = reactive<Record<number, number>>({})
const matchElsByPage = reactive<Record<number, Element[]>>({})

const totalMatchCount = computed(() => {
  let n = 0
  for (let p = 1; p <= totalPages.value; p++) n += matchCountByPage[p] ?? 0
  return n
})

// 0-based global index across all pages in page order.
const currentMatchGlobal = ref(-1)
const currentMatchDisplay = computed(() =>
  totalMatchCount.value > 0 && currentMatchGlobal.value >= 0 ? currentMatchGlobal.value + 1 : 0
)

// Map a global index to { pageNum, localIdx } using prescan counts.
function pageAndLocalForGlobal(globalIdx: number): { pageNum: number; localIdx: number } | null {
  let remaining = globalIdx
  for (let p = 1; p <= totalPages.value; p++) {
    const count = matchCountByPage[p] ?? 0
    if (remaining < count) return { pageNum: p, localIdx: remaining }
    remaining -= count
  }
  return null
}

async function navigateToGlobal(globalIdx: number) {
  if (globalIdx < 0 || globalIdx >= totalMatchCount.value) return
  const info = pageAndLocalForGlobal(globalIdx)
  if (!info) return
  const { pageNum, localIdx } = info

  // Force-render the target page if it hasn't been painted yet.
  if (!renderedPages.has(pageNum)) {
    await renderPage(pageNum)
    await nextTick()
  }

  // Move the current-match highlight.
  document.querySelector('mark.pdf-highlight.current-match')?.classList.remove('current-match')
  const el = (matchElsByPage[pageNum] ?? [])[localIdx]
  if (el) {
    el.classList.add('current-match')
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  currentMatchGlobal.value = globalIdx
}

async function nextMatch() {
  if (!totalMatchCount.value) return
  // When currentMatchGlobal is -1 (before first navigation) this correctly resolves to 0.
  await navigateToGlobal((currentMatchGlobal.value + 1) % totalMatchCount.value)
}
async function prevMatch() {
  if (!totalMatchCount.value) return
  await navigateToGlobal((currentMatchGlobal.value - 1 + totalMatchCount.value) % totalMatchCount.value)
}

async function downloadFile() {
  if (!fileUrl.value) return
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
  const hasPrevious = typeof window !== 'undefined' && window.history.state?.back != null
  if (hasPrevious) { router.back(); return }
  const q = searchQuery.value.trim()
  router.push(q ? { path: '/search', query: { q } } : '/search')
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────
type VueRefEl = Element | ComponentPublicInstance | null

const containerRef = ref<HTMLElement | null>(null)
const pageRefMap = new Map<number, HTMLElement>()
const canvasMap = new Map<number, HTMLCanvasElement>()
const textLayerMap = new Map<number, HTMLElement>()

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

      textLayerDiv.style.setProperty('--total-scale-factor', String(dims.scale))
      textLayerDiv.style.setProperty('--scale-round-x', '1px')
      textLayerDiv.style.setProperty('--scale-round-y', '1px')

      const textLayer = new pdfjsLib.TextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport
      })
      await textLayer.render()

      if (searchQuery.value.trim()) {
        const escHtml = (s: string) =>
          s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        const terms = searchQuery.value.trim().split(/\s+/).filter(t => t.length > 1)
        const pageMatches: Element[] = []

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
            span.querySelectorAll<Element>('mark.pdf-highlight').forEach(m => pageMatches.push(m))
          })
        }

        // Store in page-keyed map so global ordering is always by page number,
        // regardless of which pages happened to render first.
        matchElsByPage[pageNum] = pageMatches

        // Re-apply current-match highlight if this page contains the active match.
        if (currentMatchGlobal.value >= 0) {
          const info = pageAndLocalForGlobal(currentMatchGlobal.value)
          if (info?.pageNum === pageNum) {
            pageMatches[info.localIdx]?.classList.add('current-match')
          }
        }
      }
    }

    renderedPages.add(pageNum)
  } finally {
    _renderingPages.delete(pageNum)
  }
}

// ─── Pre-scan all pages for match counts (text only, no canvas rendering) ─────
// This gives a stable totalMatchCount before any lazy page rendering occurs,
// so the header count never grows as the user scrolls.
async function prescanAllPages(pdfDoc: any, terms: string[]) {
  if (!terms.length) return

  const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(
    `(${terms.map(t => escRe(escHtml(t))).join('|')})`,
    'gi'
  )

  await Promise.all(
    Array.from({ length: pdfDoc.numPages }, async (_, i) => {
      const pageNum = i + 1
      const page = await pdfDoc.getPage(pageNum)
      const textContent = await page.getTextContent()
      let count = 0
      for (const item of textContent.items) {
        const str = (item as any).str ?? ''
        if (!str) continue
        const hits = escHtml(str).match(regex)
        if (hits) count += hits.length
      }
      matchCountByPage[pageNum] = count
    })
  )
}

onMounted(async () => {
  if (!fileUrl.value) {
    error.value = 'No file URL provided.'
    isLoading.value = false
    return
  }

  try {
    _pdfjsLib = await import('pdfjs-dist')
    const lib = _pdfjsLib as Record<string, any>

    lib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).href

    _pdfDoc = await lib.getDocument({ url: fileUrl.value }).promise
    const pdfDoc = _pdfDoc as any

    const containerWidth = containerRef.value?.clientWidth ?? 800
    await Promise.all(
      Array.from({ length: pdfDoc.numPages }, async (_, i) => {
        const pageNum = i + 1
        const page = await pdfDoc.getPage(pageNum)
        const naturalVp = page.getViewport({ scale: 1 })
        const scale = Math.min(2, (containerWidth - 32) / naturalVp.width)
        const vp = page.getViewport({ scale })
        pageDimensions[pageNum] = { width: vp.width, height: vp.height, scale }
      })
    )

    totalPages.value = pdfDoc.numPages
    isLoading.value = false

    const terms = searchQuery.value.trim().split(/\s+/).filter(t => t.length > 1)
    if (terms.length) {
      // Scan all pages for match counts before rendering anything.
      // The header shows this stable total; it will never grow as the user scrolls.
      isScanning.value = true
      await prescanAllPages(pdfDoc, terms)
      isScanning.value = false
    }

    await nextTick()

    // Lazy-render pages as they enter the viewport (400px ahead).
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

    // Navigate to the true first match after the prescan.
    // navigateToGlobal force-renders the target page if needed, so this is
    // deterministic regardless of which pages the IntersectionObserver fires first.
    if (terms.length && totalMatchCount.value > 0) {
      await navigateToGlobal(0)
    }
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

/* All search term matches */
.pdfTextLayer mark.pdf-highlight {
  background-color: rgba(255, 213, 0, 0.45);
  border-radius: 2px;
  color: transparent;
}

/* Currently active match — brighter so it stands out from the rest */
.pdfTextLayer mark.pdf-highlight.current-match {
  background-color: rgba(255, 140, 0, 0.75);
  outline: 2px solid rgba(255, 100, 0, 0.9);
  outline-offset: 1px;
}
</style>
