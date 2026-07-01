<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-50 bg-[#1a1a2e] h-14 flex items-center px-4 shadow-lg">
      <div class="flex items-center justify-center gap-5 flex-wrap w-full">
        <span class="text-xs text-gray-400 uppercase font-medium tracking-wide">Edit Mode</span>
        <UBadge v-if="isModified" color="warning" variant="solid">Modified</UBadge>
        <span v-if="hasChanges" class="text-xs text-amber-400 font-medium">Unsaved changes</span>
        <UButton variant="outline" size="sm" icon="i-heroicons-arrow-top-right-on-square" class="text-white border-white/30 hover:bg-white/10" @click="openPreview">Preview</UButton>
        <UButton color="primary" size="sm" :loading="saving" @click="saveProject">Save Changes</UButton>
      </div>
    </header>

    <main class="flex-1">
      <div class="max-w-[900px] mx-auto px-4 py-6">
        <div v-if="loading" class="flex flex-col items-center py-16">
          <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
          <p class="mt-4 text-gray-500">Loading project...</p>
        </div>

        <div v-else-if="error" class="text-center py-16">
          <UAlert color="error" :description="error" class="mb-4" />
          <UButton variant="outline" @click="loadProject">Retry</UButton>
        </div>

        <template v-else-if="editableProject">

          <div class="mb-6">
            <label class="field-label">Title</label>
            <UInput v-model="editableProject.Title" @input="markChanged" placeholder="Project title" />
          </div>

          <div class="mb-6">
            <label class="field-label">Subtitle / Tagline</label>
            <UInput v-model="editableProject.SubTitle" @input="markChanged" placeholder="Short tagline…" />
          </div>

          <div class="mb-6">
            <label class="field-label">Slug</label>
            <UInput v-model="editableProject.slug" @input="markChanged" placeholder="project-slug" />
          </div>

          <div class="mb-6">
            <label class="field-label">Icon</label>
            <UInput v-model="editableProject.Icon" @input="markChanged" placeholder="i-lucide-folder" />
            <p class="text-xs text-gray-400 mt-1">Nuxt icon name, e.g. <code>i-lucide-folder</code></p>
          </div>

          <div class="mb-6">
            <label class="field-label">Body</label>
            <UTextarea v-model="editableProject.Body" @input="markChanged" :rows="10" placeholder="Project body content. Separate paragraphs with a blank line." />
          </div>

          <div class="mb-6">
            <label class="field-label">Authors / Project Managers</label>
            <div class="flex flex-col gap-2">
              <div v-for="(author, index) in editableProject.Authors" :key="index" class="flex items-center gap-2">
                <UInput v-model="editableProject.Authors[index]" @input="markChanged" size="sm" placeholder="Author name" class="flex-1" />
                <UButton icon="i-heroicons-x-mark" size="sm" variant="ghost" @click="removeAuthor(index)" />
              </div>
              <div><UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addAuthor">Add Author</UButton></div>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Publications</label>
            <div class="flex flex-col gap-4">
              <div
                v-for="(pub, index) in editableProject.publications"
                :key="index"
                class="border border-gray-200 rounded-lg p-4 bg-gray-50 relative"
              >
                <button class="absolute top-2 right-2 text-gray-400 hover:text-red-500" @click="removePublication(index)">
                  <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                </button>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label class="field-label-sm">Title</label>
                    <UInput v-model="pub.Title" @input="markChanged" size="sm" placeholder="Publication title" />
                  </div>
                  <div>
                    <label class="field-label-sm">Date</label>
                    <UInput v-model="pub.date" type="date" @input="markChanged" size="sm" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="field-label-sm">URL</label>
                    <UInput v-model="pub.url" @input="markChanged" size="sm" placeholder="https://… or /articles/slug" />
                  </div>
                </div>
              </div>
            </div>
            <UButton size="sm" variant="soft" icon="i-heroicons-plus" class="mt-3" @click="addPublication">Add Publication</UButton>
          </div>

          <div class="mb-6">
            <label class="field-label">Resources</label>
            <div class="flex flex-col gap-4">
              <div
                v-for="(resource, index) in editableProject.resources"
                :key="index"
                class="border border-gray-200 rounded-lg p-4 bg-gray-50 relative"
              >
                <button class="absolute top-2 right-2 text-gray-400 hover:text-red-500" @click="removeResource(index)">
                  <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
                </button>
                <div class="flex flex-col gap-3">
                  <div>
                    <label class="field-label-sm">Title</label>
                    <UInput v-model="resource.Title" @input="markChanged" size="sm" placeholder="Resource title" />
                  </div>
                  <div>
                    <label class="field-label-sm">Description</label>
                    <UTextarea v-model="resource.Description" @input="markChanged" size="sm" :rows="3" placeholder="Brief description…" />
                  </div>
                  <div>
                    <label class="field-label-sm">PDF URL</label>
                    <UInput v-model="resource.pdfUrl" @input="markChanged" size="sm" placeholder="https://…" />
                  </div>
                </div>
              </div>
            </div>
            <UButton size="sm" variant="soft" icon="i-heroicons-plus" class="mt-3" @click="addResource">Add Resource</UButton>
          </div>

        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ middleware: ['preview-access'], layout: 'preview' })

const { route, loading, saving, error, hasChanges, isModified, markChanged, openPreview, checkDraftStatus } = usePreviewEditor('/projectspreviewreadonly')
const toast = useToast()
const { fetchProjectPreviewById, updateProject } = useProjects()

const editableProject = ref(null)

const normalizeProject = (data) => {
  const d = { ...data }
  if (Array.isArray(d.Body)) {
    d.Body = d.Body.map(b => typeof b === 'string' ? b : (b.text ?? b.children?.[0]?.text ?? '')).filter(Boolean).join('\n\n')
  }
  if (!Array.isArray(d.Authors)) d.Authors = []
  if (!Array.isArray(d.publications)) d.publications = []
  if (!Array.isArray(d.resources)) d.resources = []
  return d
}

const addAuthor = () => { editableProject.value.Authors.push(''); markChanged() }
const removeAuthor = (index) => { editableProject.value.Authors.splice(index, 1); markChanged() }

const addPublication = () => { editableProject.value.publications.push({ Title: '', date: '', url: '' }); markChanged() }
const removePublication = (index) => { editableProject.value.publications.splice(index, 1); markChanged() }

const addResource = () => { editableProject.value.resources.push({ Title: '', Description: '', pdfUrl: '' }); markChanged() }
const removeResource = (index) => { editableProject.value.resources.splice(index, 1); markChanged() }

const saveProject = async () => {
  saving.value = true
  try {
    const dataToSave = {
      Title: editableProject.value.Title,
      SubTitle: editableProject.value.SubTitle,
      slug: editableProject.value.slug,
      Icon: editableProject.value.Icon,
      Body: editableProject.value.Body,
      Authors: editableProject.value.Authors.filter(a => a.trim() !== ''),
      publications: editableProject.value.publications,
      resources: editableProject.value.resources,
    }
    const updated = await updateProject(route.params.id, dataToSave, 'draft')
    editableProject.value = normalizeProject(updated)
    hasChanges.value = false
    isModified.value = true
    toast.add({ title: 'Project saved as draft. Preview and publish when ready.', color: 'green' })
  } catch (err) {
    toast.add({ title: `Failed to save: ${err.message}`, color: 'red' })
  } finally {
    saving.value = false
  }
}

const loadProject = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await fetchProjectPreviewById(route.params.id)
    editableProject.value = normalizeProject(data)
    checkDraftStatus(data)
  } catch (err) {
    error.value = `Failed to load project: ${err.message}`
  } finally {
    loading.value = false
  }
}

useAsyncData(`project-editor-${route.params.id}`, () => loadProject(), { server: false })
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
.field-label-sm {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
</style>
