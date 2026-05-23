<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-50 bg-[#1a1a2e] h-14 flex items-center px-4 shadow-lg">
      <div class="flex items-center justify-center gap-5 flex-wrap w-full">
        <span class="text-xs text-gray-400 uppercase font-medium tracking-wide">Edit Mode</span>
        <UBadge v-if="isModified" color="warning" variant="solid">Modified</UBadge>
        <span v-if="hasChanges" class="text-xs text-amber-400 font-medium">Unsaved changes</span>
        <UButton variant="outline" size="sm" icon="i-heroicons-arrow-top-right-on-square" class="text-white border-white/30 hover:bg-white/10" @click="openPreview">Preview</UButton>
        <UButton color="primary" size="sm" :loading="saving" @click="saveApp">Save Changes</UButton>
      </div>
    </header>

    <main class="flex-1">
      <div class="max-w-[900px] mx-auto px-4 py-6">
        <div v-if="loading" class="flex flex-col items-center py-16">
          <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
          <p class="mt-4 text-gray-500">Loading app...</p>
        </div>

        <div v-else-if="error" class="text-center py-16">
          <UAlert color="error" :description="error" class="mb-4" />
          <UButton variant="outline" @click="loadApp">Retry</UButton>
        </div>

        <template v-else-if="editableApp">
          <h2 class="text-xl font-bold mb-6">App Editor</h2>

          <div class="mb-6">
            <label class="field-label">Title</label>
            <UInput v-model="editableApp.title" @input="markChanged" placeholder="App title" />
          </div>

          <div class="mb-6">
            <label class="field-label">Slug</label>
            <UInput v-model="editableApp.slug" @input="markChanged" placeholder="app-slug" />
          </div>

          <div class="mb-6">
            <label class="field-label">Date</label>
            <UInput v-model="formattedDate" type="date" @input="markChanged" class="max-w-[220px]" />
          </div>

          <div class="mb-6">
            <label class="field-label">Flags</label>
            <UCheckbox v-model="editableApp.external" label="External" @change="markChanged" />
          </div>

          <div class="mb-6">
            <label class="field-label">URL</label>
            <UInput v-model="editableApp.url" @input="markChanged" placeholder="https://..." />
          </div>

          <div class="mb-6">
            <label class="field-label">Categories</label>
            <div class="flex flex-wrap gap-2 items-center">
              <div v-for="(cat, index) in editableApp.categories" :key="index" class="relative">
                <UInput v-model="editableApp.categories[index]" @input="markChanged" size="sm" class="w-40 pr-7" />
                <button class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="removeCategory(index)">
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
              </div>
              <UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addCategory">Add Category</UButton>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Tags</label>
            <div class="flex flex-wrap gap-2 items-center">
              <div v-for="(tag, index) in editableApp.tags" :key="index" class="relative">
                <UInput v-model="editableApp.tags[index]" @input="markChanged" size="sm" class="w-36 pr-7" />
                <button class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="removeTag(index)">
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
              </div>
              <UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addTag">Add Tag</UButton>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Contributors</label>
            <div class="flex flex-col gap-2">
              <div v-for="(contributor, index) in editableApp.contributors" :key="index" class="flex items-center gap-2">
                <UInput v-model="contributor.title" @input="markChanged" size="sm" placeholder="Contributor title" class="flex-1" />
                <UButton icon="i-heroicons-x-mark" size="sm" variant="ghost" @click="removeContributor(index)" />
              </div>
              <div><UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addContributor">Add Contributor</UButton></div>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Image</label>
            <div v-if="editableApp.image" class="flex items-center gap-3 mb-3">
              <img :src="imageUrl(editableApp.image)" alt="App image" class="max-h-[120px] max-w-[180px] rounded object-cover flex-shrink-0" />
              <div>
                <div class="text-sm mb-1">{{ editableApp.image.name }}</div>
                <UButton size="sm" color="error" variant="soft" @click="removeImage">Remove</UButton>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500 mb-2">No image selected</div>
            <input type="file" ref="imageInput" @change="handleImageUpload" class="hidden" accept="image/*" :disabled="uploadingImage" />
            <UButton size="sm" variant="outline" :loading="uploadingImage" @click="triggerImageUpload">
              {{ uploadingImage ? 'Uploading...' : editableApp.image ? 'Replace Image' : 'Upload Image' }}
            </UButton>
          </div>

          <div class="mb-6">
            <label class="field-label">Description</label>
            <UTextarea v-model="editableApp.description" @input="markChanged" :rows="6" placeholder="App description..." />
          </div>

          <div class="mb-6">
            <label class="field-label">Funding</label>
            <RichTextEditor v-model="editableApp.funding" @update:modelValue="markChanged" :minHeight="150" :showAllTools="false" />
          </div>

          <div class="mb-6">
            <label class="field-label">Citation</label>
            <RichTextEditor v-model="editableApp.citation" @update:modelValue="markChanged" :minHeight="150" :showAllTools="false" />
          </div>

          <!-- Related Articles -->
          <div class="mb-6">
            <label class="field-label">Related Articles</label>
            <div class="flex flex-wrap gap-1 mb-2">
              <span
                v-for="article in editableApp.articles"
                :key="article.documentId || article.id"
                class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
              >
                {{ article.Title || article.title || article.id }}
                <button class="text-gray-400 hover:text-gray-600" @click="removeArticle(article)">
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
              </span>
              <span v-if="!editableApp.articles.length" class="text-xs text-gray-400">No articles linked</span>
            </div>
            <div class="flex gap-2">
              <UInput v-model="articleSearch" @keyup.enter="searchArticles" size="sm" placeholder="Search articles by title..." class="flex-1" />
              <UButton @click="searchArticles" :loading="searchingArticles" size="sm">Search</UButton>
            </div>
            <div v-if="articleResults.length" class="mt-2 border border-gray-200 rounded-lg overflow-hidden">
              <div
                v-for="article in filteredArticleResults"
                :key="article.documentId || article.id"
                class="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                @click="addArticle(article)"
              >{{ article.Title || article.title || article.id }}</div>
              <div v-if="!filteredArticleResults.length" class="px-3 py-2 text-sm text-gray-400">All results already added</div>
            </div>
          </div>

          <!-- Related Datasets -->
          <div class="mb-6">
            <label class="field-label">Related Datasets</label>
            <div class="flex flex-wrap gap-1 mb-2">
              <span
                v-for="dataset in editableApp.datasets"
                :key="dataset.documentId || dataset.id"
                class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
              >
                {{ dataset.title || dataset.Title || dataset.id }}
                <button class="text-gray-400 hover:text-gray-600" @click="removeDataset(dataset)">
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
              </span>
              <span v-if="!editableApp.datasets.length" class="text-xs text-gray-400">No datasets linked</span>
            </div>
            <div class="flex gap-2">
              <UInput v-model="datasetSearch" @keyup.enter="searchDatasets" size="sm" placeholder="Search datasets by title..." class="flex-1" />
              <UButton @click="searchDatasets" :loading="searchingDatasets" size="sm">Search</UButton>
            </div>
            <div v-if="datasetResults.length" class="mt-2 border border-gray-200 rounded-lg overflow-hidden">
              <div
                v-for="dataset in filteredDatasetResults"
                :key="dataset.documentId || dataset.id"
                class="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                @click="addDataset(dataset)"
              >{{ dataset.title || dataset.Title || dataset.id }}</div>
              <div v-if="!filteredDatasetResults.length" class="px-3 py-2 text-sm text-gray-400">All results already added</div>
            </div>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ middleware: ['preview-access'] })

const { route, loading, saving, error, hasChanges, isModified, markChanged, openPreview, makeFormattedDate, checkDraftStatus } = usePreviewEditor('/appspreviewreadonly')
const { resolveImageUrl } = usePreviewUtils()
const toast = useToast()
const { fetchAppPreviewById, updateApp } = useApps()
const { uploadMedia } = useMedia()
const { fetchArticlesBasic } = useArticles()
const { fetchDatasetsBasic } = useDatasets()

const originalApp = ref(null)
const editableApp = ref(null)
const uploadingImage = ref(false)
const imageInput = ref(null)

const formattedDate = makeFormattedDate(editableApp, 'date')

const articleRel = useRelatedSearch(fetchArticlesBasic)
const { query: articleSearch, searching: searchingArticles, results: articleResults } = articleRel
const searchArticles = () => articleRel.search()
const filteredArticleResults = computed(() => articleRel.filteredFor(editableApp.value?.articles || []))
const addArticle = (article) => articleRel.addTo(editableApp.value.articles, article, markChanged)
const removeArticle = (article) => articleRel.removeFrom(editableApp.value.articles, article, markChanged)

const datasetRel = useRelatedSearch(fetchDatasetsBasic)
const { query: datasetSearch, searching: searchingDatasets, results: datasetResults } = datasetRel
const searchDatasets = () => datasetRel.search()
const filteredDatasetResults = computed(() => datasetRel.filteredFor(editableApp.value?.datasets || []))
const addDataset = (dataset) => datasetRel.addTo(editableApp.value.datasets, dataset, markChanged)
const removeDataset = (dataset) => datasetRel.removeFrom(editableApp.value.datasets, dataset, markChanged)

const addCategory = () => { if (!editableApp.value.categories) editableApp.value.categories = []; editableApp.value.categories.push(''); markChanged() }
const removeCategory = (index) => { editableApp.value.categories.splice(index, 1); markChanged() }
const addTag = () => { if (!editableApp.value.tags) editableApp.value.tags = []; editableApp.value.tags.push(''); markChanged() }
const removeTag = (index) => { editableApp.value.tags.splice(index, 1); markChanged() }
const addContributor = () => { if (!editableApp.value.contributors) editableApp.value.contributors = []; editableApp.value.contributors.push({ title: '' }); markChanged() }
const removeContributor = (index) => { editableApp.value.contributors.splice(index, 1); markChanged() }

const imageUrl = (img) => resolveImageUrl(img) || ''
const triggerImageUpload = () => { imageInput.value.click() }

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  uploadingImage.value = true
  try {
    const uploadedMedia = await uploadMedia(file)
    const { related: _r, ...cleanMedia } = uploadedMedia
    editableApp.value.image = cleanMedia
    markChanged()
    toast.add({ title: 'Image uploaded successfully!', color: 'green' })
  } catch (err) {
    toast.add({ title: `Failed to upload image: ${err.message}`, color: 'red' })
  } finally { uploadingImage.value = false; if (imageInput.value) imageInput.value.value = '' }
}

const removeImage = () => { editableApp.value.image = null; markChanged() }

const saveApp = async () => {
  saving.value = true
  try {
    const dataToSave = {
      title: editableApp.value.title, slug: editableApp.value.slug, date: editableApp.value.date,
      external: editableApp.value.external, url: editableApp.value.url,
      categories: editableApp.value.categories?.filter(c => c.trim() !== ''),
      tags: editableApp.value.tags?.filter(t => t.trim() !== ''),
      contributors: editableApp.value.contributors?.filter(c => c.title?.trim() !== ''),
      image: editableApp.value.image, description: editableApp.value.description,
      funding: editableApp.value.funding, citation: editableApp.value.citation,
      articles: editableApp.value.articles, datasets: editableApp.value.datasets,
    }
    const updated = await updateApp(route.params.id, dataToSave, 'draft')
    originalApp.value = JSON.parse(JSON.stringify(updated))
    editableApp.value = normalizeApp(updated)
    hasChanges.value = false; isModified.value = true
    toast.add({ title: 'App saved as draft. Preview and publish when ready.', color: 'green' })
  } catch (err) {
    toast.add({ title: `Failed to save: ${err.message}`, color: 'red' })
  } finally { saving.value = false }
}

const normalizeApp = (data) => {
  const d = { ...data }
  if (!d.categories) d.categories = []
  if (!d.tags) d.tags = []
  if (!Array.isArray(d.contributors)) d.contributors = []
  if (!Array.isArray(d.articles)) d.articles = []
  if (!Array.isArray(d.datasets)) d.datasets = []
  if (Array.isArray(d.image)) d.image = d.image[0] || null
  return d
}

const loadApp = async () => {
  loading.value = true; error.value = null
  try {
    const data = await fetchAppPreviewById(route.params.id)
    originalApp.value = JSON.parse(JSON.stringify(data))
    editableApp.value = normalizeApp(data)
    checkDraftStatus(data)
  } catch (err) {
    error.value = `Failed to load app: ${err.message}`
  } finally { loading.value = false }
}

const handleDocumentClick = () => { articleResults.value = []; datasetResults.value = [] }

useAsyncData(`app-editor-${route.params.id}`, () => loadApp(), { server: false })

watchEffect((onCleanup) => {
  if (!import.meta.client) return
  document.addEventListener('click', handleDocumentClick)
  onCleanup(() => document.removeEventListener('click', handleDocumentClick))
})
</script>

<style scoped>
.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
