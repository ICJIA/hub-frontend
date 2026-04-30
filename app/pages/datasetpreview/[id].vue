<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-50 bg-[#1a1a2e] h-14 flex items-center px-4 shadow-lg">
      <div class="flex items-center justify-center gap-5 flex-wrap w-full">
        <span class="text-xs text-gray-400 uppercase font-medium tracking-wide">Edit Mode</span>
        <UBadge v-if="isModified" color="warning" variant="solid">Modified</UBadge>
        <span v-if="hasChanges" class="text-xs text-amber-400 font-medium">Unsaved changes</span>
        <UButton variant="outline" size="sm" icon="i-heroicons-arrow-top-right-on-square" class="text-white border-white/30 hover:bg-white/10" @click="openPreview">Preview</UButton>
        <UButton color="primary" size="sm" :loading="saving" @click="saveDataset">Save Changes</UButton>
      </div>
    </header>

    <main class="flex-1">
      <div class="max-w-[900px] mx-auto px-4 py-6">
        <div v-if="loading" class="flex flex-col items-center py-16">
          <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
          <p class="mt-4 text-gray-500">Loading dataset...</p>
        </div>

        <div v-else-if="error" class="text-center py-16">
          <UAlert color="error" :description="error" class="mb-4" />
          <UButton variant="outline" @click="loadDataset">Retry</UButton>
        </div>

        <template v-else-if="editableDataset">
          <div class="mb-6">
            <label class="field-label">Title</label>
            <UInput v-model="editableDataset.title" @input="markChanged" placeholder="Dataset title" />
          </div>

          <div class="mb-6">
            <label class="field-label">Slug</label>
            <UInput v-model="editableDataset.slug" @input="markChanged" placeholder="dataset-slug" />
          </div>

          <div class="mb-6">
            <label class="field-label">Date</label>
            <UInput v-model="formattedDate" type="date" @input="markChanged" class="max-w-[220px]" />
          </div>

          <div class="mb-6">
            <label class="field-label">Flags</label>
            <div class="flex gap-4">
              <UCheckbox v-model="editableDataset.external" @change="markChanged" label="External" />
              <UCheckbox v-model="editableDataset.project" @change="markChanged" label="Project" />
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Categories</label>
            <div class="flex flex-wrap gap-2 items-center">
              <div v-for="(_, index) in editableDataset.categories" :key="index" class="relative">
                <UInput v-model="editableDataset.categories[index]" @input="markChanged" size="sm" class="w-40 pr-7" />
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
              <div v-for="(_, index) in editableDataset.tags" :key="index" class="relative">
                <UInput v-model="editableDataset.tags[index]" @input="markChanged" size="sm" class="w-36 pr-7" />
                <button class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="removeTag(index)">
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
              </div>
              <UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addTag">Add Tag</UButton>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Unit</label>
            <UInput v-model="editableDataset.unit" @input="markChanged" placeholder="e.g. state, county, city" />
          </div>

          <div class="mb-6">
            <label class="field-label">Time Period</label>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="sub-label">Year Type</label>
                <UInput v-model="editableDataset.timeperiod.yeartype" @input="markChanged" size="sm" placeholder="e.g. calendar, fiscal" class="w-[200px]" />
              </div>
              <div>
                <label class="sub-label">Year Min</label>
                <UInput v-model="editableDataset.timeperiod.yearmin" @input="markChanged" size="sm" placeholder="e.g. 2019" class="w-[140px]" />
              </div>
              <div>
                <label class="sub-label">Year Max</label>
                <UInput v-model="editableDataset.timeperiod.yearmax" @input="markChanged" size="sm" placeholder="e.g. 2024" class="w-[140px]" />
              </div>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Sources</label>
            <div class="flex flex-col gap-3">
              <div v-for="(source, index) in editableDataset.sources" :key="index" class="border border-gray-200 rounded-lg p-3">
                <div class="flex flex-wrap gap-3 items-start">
                  <div class="flex-1">
                    <label class="sub-label">Title</label>
                    <UInput v-model="source.title" @input="markChanged" size="sm" placeholder="Source title" />
                  </div>
                  <div class="flex-1">
                    <label class="sub-label">URL</label>
                    <UInput v-model="source.url" @input="markChanged" size="sm" placeholder="https://..." />
                  </div>
                  <UButton icon="i-heroicons-x-mark" size="sm" variant="ghost" color="error" @click="removeSource(index)" class="mt-5" />
                </div>
              </div>
              <div><UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addSource">Add Source</UButton></div>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Description</label>
            <UTextarea v-model="editableDataset.description" @input="markChanged" :rows="8" placeholder="Dataset description..." />
          </div>

          <div class="mb-6">
            <label class="field-label">Notes</label>
            <div class="flex flex-col gap-2">
              <div v-for="(_, index) in editableDataset.notes" :key="index" class="flex items-start gap-2">
                <UTextarea v-model="editableDataset.notes[index]" @input="markChanged" :rows="2" placeholder="Note text..." class="flex-1" />
                <UButton icon="i-heroicons-x-mark" size="sm" variant="ghost" color="error" @click="removeNote(index)" class="mt-1" />
              </div>
              <div><UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addNote">Add Note</UButton></div>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Variables</label>
            <div class="flex flex-col gap-2 mb-3">
              <details
                v-for="(variable, index) in editableDataset.variables"
                :key="index"
                class="border border-gray-200 rounded-lg"
              >
                <summary class="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 select-none">
                  <span class="text-sm font-medium">{{ variable.name || `Variable ${index + 1}` }}</span>
                  <UButton icon="i-heroicons-x-mark" size="xs" variant="ghost" color="error" @click.prevent="removeVariable(index)" />
                </summary>
                <div class="px-4 pb-4 flex flex-col gap-3">
                  <div>
                    <label class="sub-label">Name</label>
                    <UInput v-model="variable.name" @input="markChanged" size="sm" placeholder="Variable name" />
                  </div>
                  <div>
                    <label class="sub-label">Type</label>
                    <UInput v-model="variable.type" @input="markChanged" size="sm" placeholder="e.g. String, Integer, Date" />
                  </div>
                  <div>
                    <label class="sub-label">Definition</label>
                    <UTextarea v-model="variable.definition" @input="markChanged" :rows="3" placeholder="Variable definition..." />
                  </div>
                  <div>
                    <label class="sub-label">Values</label>
                    <UInput v-model="variable.values" @input="markChanged" size="sm" placeholder="Possible values or range" />
                  </div>
                </div>
              </details>
            </div>
            <UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addVariable">Add Variable</UButton>
          </div>

          <div class="mb-6">
            <label class="field-label">Funding</label>
            <RichTextEditor v-model="editableDataset.funding" @update:modelValue="markChanged" :minHeight="150" :showAllTools="false" />
          </div>

          <div class="mb-6">
            <label class="field-label">Citation</label>
            <RichTextEditor v-model="editableDataset.citation" @update:modelValue="markChanged" :minHeight="150" :showAllTools="false" />
          </div>

          <!-- Related Apps -->
          <div class="mb-6">
            <label class="field-label">Related Apps</label>
            <div class="flex flex-wrap gap-1 mb-2">
              <span v-for="app in editableDataset.apps" :key="app.documentId || app.id" class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                {{ app.Title || app.title || app.id }}
                <button class="text-gray-400 hover:text-gray-600" @click="removeApp(app)"><UIcon name="i-heroicons-x-mark" class="w-3 h-3" /></button>
              </span>
              <span v-if="!editableDataset.apps.length" class="text-xs text-gray-400">No apps linked</span>
            </div>
            <div class="flex gap-2 mb-2">
              <UInput v-model="appSearch" @keyup.enter="searchApps" size="sm" placeholder="Search apps by title..." class="max-w-[400px]" />
              <UButton size="sm" variant="soft" :loading="searchingApps" @click="searchApps">Search</UButton>
            </div>
            <div v-if="appResults.length" class="border border-gray-200 rounded-lg overflow-hidden max-w-[400px]">
              <div v-for="app in filteredAppResults" :key="app.documentId || app.id" class="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0" @click="addApp(app)">{{ app.Title || app.title || app.id }}</div>
              <div v-if="!filteredAppResults.length" class="px-3 py-2 text-sm text-gray-400">All results already added</div>
            </div>
          </div>

          <!-- Related Articles -->
          <div class="mb-6">
            <label class="field-label">Related Articles</label>
            <div class="flex flex-wrap gap-1 mb-2">
              <span v-for="article in editableDataset.articles" :key="article.documentId || article.id" class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm">
                {{ article.Title || article.title || article.id }}
                <button class="text-gray-400 hover:text-gray-600" @click="removeArticle(article)"><UIcon name="i-heroicons-x-mark" class="w-3 h-3" /></button>
              </span>
              <span v-if="!editableDataset.articles.length" class="text-xs text-gray-400">No articles linked</span>
            </div>
            <div class="flex gap-2 mb-2">
              <UInput v-model="articleSearch" @keyup.enter="searchArticles" size="sm" placeholder="Search articles by title..." class="max-w-[400px]" />
              <UButton size="sm" variant="soft" :loading="searchingArticles" @click="searchArticles">Search</UButton>
            </div>
            <div v-if="articleResults.length" class="border border-gray-200 rounded-lg overflow-hidden max-w-[400px]">
              <div v-for="article in filteredArticleResults" :key="article.documentId || article.id" class="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0" @click="addArticle(article)">{{ article.Title || article.title || article.id }}</div>
              <div v-if="!filteredArticleResults.length" class="px-3 py-2 text-sm text-gray-400">All results already added</div>
            </div>
          </div>

          <!-- Data Files -->
          <div class="mb-6">
            <label class="field-label">Data Files</label>
            <div class="flex flex-col gap-2 mb-3">
              <div v-for="(file, index) in editableDataset.datafile" :key="file.id || index" class="flex items-center gap-2">
                <UIcon name="i-heroicons-document" class="w-4 h-4 text-gray-400" />
                <span class="text-sm">{{ file.name || `File ${index + 1}` }}</span>
                <span v-if="file.size" class="text-xs text-gray-400">({{ formatFileSize(file.size) }})</span>
                <UButton icon="i-heroicons-x-mark" size="xs" variant="ghost" color="error" @click="removeDatafile(index)" />
              </div>
            </div>
            <input type="file" ref="datafileInput" @change="handleDatafileUpload" class="hidden" :disabled="uploading" />
            <UButton size="sm" variant="outline" icon="i-heroicons-arrow-up-tray" :loading="uploading" @click="triggerDatafileUpload">Upload File</UButton>
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ middleware: ['preview-access'] })

import { ref, computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { generateToken } from '~/utils/previewToken'

const route = useRoute()
const toast = useToast()
const { fetchDatasetPreviewById, updateDataset } = useDatasets()
const { uploadMedia } = useMedia()
const { fetchAppsBasic } = useApps()
const { fetchArticlesBasic } = useArticles()

const originalDataset = ref(null)
const editableDataset = ref(null)
const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const error = ref(null)
const hasChanges = ref(false)
const isModified = ref(false)
const datafileInput = ref(null)

const appSearch = ref('')
const appResults = ref([])
const searchingApps = ref(false)
const articleSearch = ref('')
const articleResults = ref([])
const searchingArticles = ref(false)

const markChanged = () => { hasChanges.value = true }

const formattedDate = computed({
  get() {
    if (!editableDataset.value?.date) return ''
    return new Date(editableDataset.value.date).toISOString().split('T')[0]
  },
  set(value) { editableDataset.value.date = value; markChanged() }
})

const openPreview = () => {
  const id = route.params.id
  const params = new URLSearchParams(window.location.search)
  params.set('token', generateToken())
  window.open(`/datasetpreviewreadonly/${id}?${params.toString()}`, '_blank')
}

const addCategory = () => { if (!editableDataset.value.categories) editableDataset.value.categories = []; editableDataset.value.categories.push(''); markChanged() }
const removeCategory = (index) => { editableDataset.value.categories.splice(index, 1); markChanged() }
const addTag = () => { if (!editableDataset.value.tags) editableDataset.value.tags = []; editableDataset.value.tags.push(''); markChanged() }
const removeTag = (index) => { editableDataset.value.tags.splice(index, 1); markChanged() }
const addNote = () => { if (!editableDataset.value.notes) editableDataset.value.notes = []; editableDataset.value.notes.push(''); markChanged() }
const removeNote = (index) => { editableDataset.value.notes.splice(index, 1); markChanged() }
const addSource = () => { if (!editableDataset.value.sources) editableDataset.value.sources = []; editableDataset.value.sources.push({ title: '', url: '' }); markChanged() }
const removeSource = (index) => { editableDataset.value.sources.splice(index, 1); markChanged() }
const addVariable = () => { if (!editableDataset.value.variables) editableDataset.value.variables = []; editableDataset.value.variables.push({ name: '', type: '', definition: '', values: '' }); markChanged() }
const removeVariable = (index) => { editableDataset.value.variables.splice(index, 1); markChanged() }

const filteredAppResults = computed(() => {
  const selectedIds = new Set((editableDataset.value?.apps || []).map(a => a.documentId || a.id))
  return appResults.value.filter(a => !selectedIds.has(a.documentId || a.id))
})
const searchApps = async () => {
  searchingApps.value = true
  try { appResults.value = await fetchAppsBasic(appSearch.value) }
  catch (err) { toast.add({ title: `Failed to search apps: ${err.message}`, color: 'red' }) }
  finally { searchingApps.value = false }
}
const addApp = (app) => {
  if (!editableDataset.value.apps) editableDataset.value.apps = []
  const alreadyAdded = editableDataset.value.apps.some(a => (a.documentId || a.id) === (app.documentId || app.id))
  if (!alreadyAdded) { editableDataset.value.apps.push(app); markChanged() }
}
const removeApp = (app) => { editableDataset.value.apps = editableDataset.value.apps.filter(a => (a.documentId || a.id) !== (app.documentId || app.id)); markChanged() }

const filteredArticleResults = computed(() => {
  const selectedIds = new Set((editableDataset.value?.articles || []).map(a => a.documentId || a.id))
  return articleResults.value.filter(a => !selectedIds.has(a.documentId || a.id))
})
const searchArticles = async () => {
  searchingArticles.value = true
  try { articleResults.value = await fetchArticlesBasic(articleSearch.value) }
  catch (err) { toast.add({ title: `Failed to search articles: ${err.message}`, color: 'red' }) }
  finally { searchingArticles.value = false }
}
const addArticle = (article) => {
  if (!editableDataset.value.articles) editableDataset.value.articles = []
  const alreadyAdded = editableDataset.value.articles.some(a => (a.documentId || a.id) === (article.documentId || article.id))
  if (!alreadyAdded) { editableDataset.value.articles.push(article); markChanged() }
}
const removeArticle = (article) => { editableDataset.value.articles = editableDataset.value.articles.filter(a => (a.documentId || a.id) !== (article.documentId || article.id)); markChanged() }

const triggerDatafileUpload = () => { datafileInput.value.click() }
const handleDatafileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  uploading.value = true
  try {
    const uploadedMedia = await uploadMedia(file)
    if (!editableDataset.value.datafile) editableDataset.value.datafile = []
    const { related: _r, ...cleanMedia } = uploadedMedia
    editableDataset.value.datafile.push(cleanMedia)
    markChanged()
    toast.add({ title: 'File uploaded successfully!', color: 'green' })
  } catch (err) {
    toast.add({ title: `Failed to upload file: ${err.message}`, color: 'red' })
  } finally { uploading.value = false; if (datafileInput.value) datafileInput.value.value = '' }
}
const removeDatafile = (index) => { editableDataset.value.datafile.splice(index, 1); markChanged() }

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const saveDataset = async () => {
  saving.value = true
  try {
    const id = route.params.id
    const dataToSave = {
      title: editableDataset.value.title, slug: editableDataset.value.slug, date: editableDataset.value.date,
      external: editableDataset.value.external, project: editableDataset.value.project,
      categories: editableDataset.value.categories?.filter(c => c.trim() !== ''),
      tags: editableDataset.value.tags?.filter(t => t.trim() !== ''),
      unit: editableDataset.value.unit, timeperiod: editableDataset.value.timeperiod,
      sources: editableDataset.value.sources?.filter(s => s.title || s.url),
      description: editableDataset.value.description,
      notes: editableDataset.value.notes?.filter(n => n.trim() !== ''),
      variables: editableDataset.value.variables?.filter(v => v.name || v.definition),
      funding: editableDataset.value.funding, citation: editableDataset.value.citation,
      apps: editableDataset.value.apps, articles: editableDataset.value.articles,
      datafile: editableDataset.value.datafile,
    }
    const updated = await updateDataset(id, dataToSave, 'draft')
    originalDataset.value = JSON.parse(JSON.stringify(updated))
    editableDataset.value = normalizeDataset(updated)
    hasChanges.value = false; isModified.value = true
    toast.add({ title: 'Dataset saved as draft. Preview and publish when ready.', color: 'green' })
  } catch (err) {
    toast.add({ title: `Failed to save: ${err.message}`, color: 'red' })
  } finally { saving.value = false }
}

const normalizeDataset = (data) => {
  const d = { ...data }
  if (!d.categories) d.categories = []
  if (!d.tags) d.tags = []
  if (!d.sources) d.sources = []
  if (!d.variables) d.variables = []
  if (!Array.isArray(d.notes)) d.notes = d.notes ? [String(d.notes)] : []
  // datafile is now a single media object from the API; normalize to array for the edit form
  if (!d.datafile) d.datafile = []
  else if (!Array.isArray(d.datafile)) {
    const { related: _r, ...rest } = d.datafile
    d.datafile = [rest]
  } else d.datafile = d.datafile.map(({ related: _r, ...rest }) => rest)
  if (!d.timeperiod) d.timeperiod = { yeartype: '', yearmin: '', yearmax: '' }
  if (!Array.isArray(d.apps)) d.apps = []
  if (!Array.isArray(d.articles)) d.articles = []
  return d
}

const loadDataset = async () => {
  loading.value = true; error.value = null
  try {
    const id = route.params.id
    const data = await fetchDatasetPreviewById(id)
    originalDataset.value = JSON.parse(JSON.stringify(data))
    editableDataset.value = normalizeDataset(data)
    const params = new URLSearchParams(window.location.search)
    if (data.publishedAt === null || params.get('status') === 'draft') isModified.value = true
  } catch (err) {
    error.value = `Failed to load dataset: ${err.message}`
  } finally { loading.value = false }
}

const handleBeforeUnload = (e) => { if (hasChanges.value) { e.preventDefault(); e.returnValue = '' } }

useAsyncData(`dataset-editor-${route.params.id}`, () => loadDataset(), { server: false })

watchEffect((onCleanup) => {
  if (!import.meta.client) return
  window.addEventListener('beforeunload', handleBeforeUnload)
  onCleanup(() => window.removeEventListener('beforeunload', handleBeforeUnload))
})
</script>

<style scoped>
.field-label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.sub-label { display: block; font-size: 12px; font-weight: 500; color: #777; margin-bottom: 4px; }
</style>
