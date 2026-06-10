import { nextTick, type Ref } from 'vue'

const MARK_CLASS = 'search-hl'

function applyHighlights(container: HTMLElement, query: string) {
  const q = query.trim().toLowerCase()
  // Remove any previous highlights first
  for (const mark of container.querySelectorAll<HTMLElement>(`mark.${MARK_CLASS}`)) {
    const parent = mark.parentNode!
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark)
    parent.removeChild(mark)
  }
  container.normalize()

  if (!q) return

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const hits: Text[] = []
  let node: Node | null
  while ((node = walker.nextNode())) {
    if ((node as Text).textContent?.toLowerCase().includes(q)) hits.push(node as Text)
  }

  for (const textNode of hits) {
    const text = textNode.textContent ?? ''
    const lower = text.toLowerCase()
    const parts: Node[] = []
    let last = 0
    let idx = lower.indexOf(q)
    while (idx !== -1) {
      if (idx > last) parts.push(document.createTextNode(text.slice(last, idx)))
      const mark = document.createElement('mark')
      mark.className = MARK_CLASS
      mark.style.cssText = 'background:rgba(253,224,71,0.55);border-radius:2px;'
      mark.textContent = text.slice(idx, idx + q.length)
      parts.push(mark)
      last = idx + q.length
      idx = lower.indexOf(q, last)
    }
    if (last < text.length) parts.push(document.createTextNode(text.slice(last)))
    const parent = textNode.parentNode!
    for (const part of parts) parent.insertBefore(part, textNode)
    parent.removeChild(textNode)
  }
}

/**
 * Returns an `applyHighlight` function that highlights `query` inside a DOM
 * element. Call it after reactive content has been rendered (e.g. inside a
 * watch callback after v-html updates).
 *
 * Usage:
 *   const contentRef = ref<HTMLElement | null>(null)
 *   const { applyHighlight } = useSearchHighlight(contentRef, query)
 *   watch([article, query], async () => { await nextTick(); applyHighlight() })
 */
export function useSearchHighlight(
  containerRef: Ref<HTMLElement | null | undefined>,
  query: Ref<string>
) {
  const applyHighlight = async () => {
    await nextTick()
    if (!containerRef.value) return
    applyHighlights(containerRef.value, query.value)
  }

  return { applyHighlight }
}
