// Factory for related-content search used in preview edit pages.
// Returns search state and helpers for a single content type.
export const useRelatedSearch = (fetchFn) => {
  const toast = useToast()
  const query = ref('')
  const results = ref([])
  const searching = ref(false)

  const search = async () => {
    searching.value = true
    try {
      results.value = await fetchFn(query.value)
    } catch (err) {
      toast.add({ title: `Search failed: ${err.message}`, color: 'red' })
    } finally {
      searching.value = false
    }
  }

  // Returns results excluding items already in selectedItems
  const filteredFor = (selectedItems) => {
    const selectedIds = new Set((selectedItems || []).map(i => i.documentId || i.id))
    return results.value.filter(i => !selectedIds.has(i.documentId || i.id))
  }

  const addTo = (list, item, onChange) => {
    if (!list) return
    const alreadyAdded = list.some(a => (a.documentId || a.id) === (item.documentId || item.id))
    if (!alreadyAdded) { list.push(item); onChange() }
  }

  const removeFrom = (list, item, onChange) => {
    const idx = list.findIndex(a => (a.documentId || a.id) === (item.documentId || item.id))
    if (idx !== -1) { list.splice(idx, 1); onChange() }
  }

  return { query, results, searching, search, filteredFor, addTo, removeFrom }
}
