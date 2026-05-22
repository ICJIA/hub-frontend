export const usePreviewReadonly = () => {
  const route = useRoute()
  const toast = useToast()

  const loading = ref(true)
  const error = ref(null)
  const viewMode = ref('desktop')
  const publishing = ref(false)

  // Returns a handler function bound to the given publish API call and success message
  const createPublishHandler = (publishFn, successMsg) => async () => {
    publishing.value = true
    try {
      await publishFn(route.params.id)
      toast.add({ title: successMsg, color: 'green' })
    } catch (err) {
      toast.add({ title: `Failed to publish: ${err.message}`, color: 'red' })
    } finally {
      publishing.value = false
    }
  }

  return { loading, error, viewMode, publishing, createPublishHandler }
}
