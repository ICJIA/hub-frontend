export const usePreviewEditor = (readonlyPreviewPath) => {
  const route = useRoute()

  const loading = ref(true)
  const saving = ref(false)
  const error = ref(null)
  const hasChanges = ref(false)
  const isModified = ref(false)

  const markChanged = () => { hasChanges.value = true }

  const openPreview = async () => {
    const params = new URLSearchParams(window.location.search)
    params.set('token', await generateToken())
    window.open(`${readonlyPreviewPath}/${route.params.id}?${params.toString()}`, '_blank')
  }

  // Returns a writable computed suitable for v-model on a date input
  const makeFormattedDate = (dataRef, key) => computed({
    get() {
      if (!dataRef.value?.[key]) return ''
      return new Date(dataRef.value[key]).toISOString().split('T')[0]
    },
    set(value) {
      if (dataRef.value) { dataRef.value[key] = value; markChanged() }
    }
  })

  // Set isModified if the loaded data is a draft
  const checkDraftStatus = (data) => {
    const params = new URLSearchParams(window.location.search)
    if (data.publishedAt === null || params.get('status') === 'draft') isModified.value = true
  }

  const handleBeforeUnload = (e) => {
    if (hasChanges.value) { e.preventDefault(); e.returnValue = '' }
  }

  watchEffect((onCleanup) => {
    if (!import.meta.client) return
    window.addEventListener('beforeunload', handleBeforeUnload)
    onCleanup(() => window.removeEventListener('beforeunload', handleBeforeUnload))
  })

  return {
    route,
    loading, saving, error, hasChanges, isModified,
    markChanged, openPreview, makeFormattedDate, checkDraftStatus
  }
}
