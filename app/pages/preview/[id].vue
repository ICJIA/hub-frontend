<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-50 bg-[#1a1a2e] h-14 flex items-center px-4 shadow-lg">
      <div class="flex items-center justify-center gap-5 flex-wrap w-full">
        <span class="text-xs text-gray-400 uppercase font-medium tracking-wide">Edit Mode</span>
        <UBadge v-if="isModified" color="warning" variant="solid">Modified</UBadge>
        <span v-if="hasChanges" class="text-xs text-amber-400 font-medium">Unsaved changes</span>
        <UButton variant="outline" size="sm" icon="i-heroicons-arrow-top-right-on-square" class="text-white border-white/30 hover:bg-white/10" @click="openPreview">Preview</UButton>
        <UButton color="primary" size="sm" :loading="saving" @click="saveArticle">Save Changes</UButton>
      </div>
    </header>

    <main class="flex-1">
      <div class="max-w-[900px] mx-auto px-4 py-6">
        <div v-if="loading" class="flex flex-col items-center py-16">
          <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
          <p class="mt-4 text-gray-500">Loading article...</p>
        </div>

        <div v-else-if="error" class="text-center py-16">
          <UAlert color="error" :description="error" class="mb-4" />
          <UButton variant="outline" @click="loadArticle">Retry</UButton>
        </div>

        <template v-else-if="editableArticle">
          <div class="mb-6">
            <label class="field-label">Categories</label>
            <div class="flex flex-wrap gap-2 items-center">
              <div v-for="(category, index) in editableArticle.Categories" :key="index" class="relative">
                <UInput v-model="editableArticle.Categories[index]" @input="markChanged" size="sm" class="w-40 pr-7" />
                <button class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="removeCategory(index)">
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
              </div>
              <UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addCategory">Add Category</UButton>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Title</label>
            <UInput v-model="editableArticle.Title" @input="markChanged" placeholder="Article Title" />
          </div>

          <div class="mb-6">
            <label class="field-label">Date</label>
            <UInput v-model="formattedDate" type="date" @input="markChanged" class="max-w-[220px]" />
          </div>

          <div class="mb-6">
            <label class="field-label">Authors</label>
            <div class="flex flex-col gap-2">
              <div v-for="(author, index) in editableArticle.Authors" :key="index" class="flex items-center gap-2">
                <UInput v-model="editableArticle.Authors[index].title" @input="markChanged" size="sm" placeholder="Author name" class="flex-1" />
                <UButton icon="i-heroicons-x-mark" size="sm" variant="ghost" @click="removeAuthor(index)" />
              </div>
              <div><UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addAuthor">Add Author</UButton></div>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Splash Image</label>
            <div v-if="splashImageUrl" class="mb-3">
              <img :src="splashImageUrl" :alt="editableArticle.Title" class="max-h-[200px] max-w-[350px] rounded mb-2 object-cover" />
              <UButton size="sm" color="error" variant="soft" @click="removeImage">Remove Image</UButton>
            </div>
            <input type="file" @change="handleImageUpload" accept="image/*" ref="imageInput" class="hidden" :disabled="uploading" />
            <UButton size="sm" variant="outline" :loading="uploading" @click="triggerImageUpload">
              {{ splashImageUrl ? 'Change Image' : 'Upload Image' }}
            </UButton>
          </div>

          <div class="mb-6">
            <label class="field-label">Abstract / Summary</label>
            <RichTextEditor v-model="editableArticle.Abstract" @update:modelValue="markChanged" :minHeight="150" :showAllTools="false" />
          </div>

          <div class="mb-6">
            <label class="field-label">Article Content</label>
            <RichTextEditor ref="mainEditorRef" v-model="editorContent" @update:modelValue="markChanged" :minHeight="400" :showAllTools="true" :markdown="true" />
          </div>

          <div class="mb-6">
            <label class="field-label">Tags</label>
            <div class="flex flex-wrap gap-2 items-center">
              <div v-for="(tag, index) in editableArticle.Tags" :key="index" class="relative">
                <UInput v-model="editableArticle.Tags[index]" @input="markChanged" size="sm" class="w-36 pr-7" />
                <button class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="removeTag(index)">
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
              </div>
              <UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addTag">Add Tag</UButton>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Funding</label>
            <RichTextEditor v-model="editableArticle.Funding" @update:modelValue="markChanged" :minHeight="150" :showAllTools="false" />
          </div>

          <div class="mb-6">
            <label class="field-label">Citation</label>
            <RichTextEditor v-model="editableArticle.Citation" @update:modelValue="markChanged" :minHeight="150" :showAllTools="false" />
          </div>

          <div class="mb-6">
            <label class="field-label">DOI</label>
            <UInput v-model="editableArticle.Doi" @input="markChanged" placeholder="DOI..." />
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
import TurndownService from 'turndown'
import { marked } from 'marked'
import markedFootnote from 'marked-footnote'
import { generateToken } from '~/utils/previewToken'

const turndownService = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' })
turndownService.addRule('span', {
  filter: 'span',
  replacement: (content, node) => {
    const style = node.getAttribute('style') || ''
    const isBold = style.includes('font-weight') && (style.includes('bold') || /font-weight:\s*[6-9]00/.test(style))
    const isItalic = style.includes('font-style') && style.includes('italic')
    if (isBold && isItalic) return `***${content}***`
    if (isBold) return `**${content}**`
    if (isItalic) return `_${content}_`
    return content
  }
})
turndownService.addRule('link', {
  filter: (node) => node.nodeName === 'A' && node.getAttribute('href'),
  replacement: (content, node) => {
    const href = node.getAttribute('href')
    const target = node.getAttribute('target')
    if (target === '_blank') return `[${content || href}](${href} "_blank")`
    const title = node.title ? ` "${node.title}"` : ''
    return `[${content || href}](${href}${title})`
  }
})
turndownService.addRule('table', {
  filter: 'table',
  replacement: function(content, node) {
    const rows = node.querySelectorAll('tr')
    if (rows.length === 0) return ''
    let markdown = '\n\n'
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td, th')
      const cellContents = Array.from(cells).map(cell => cell.textContent.trim().replace(/\|/g, '\\|') || ' ')
      markdown += '| ' + cellContents.join(' | ') + ' |\n'
      if (rowIndex === 0) markdown += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n'
    })
    return markdown + '\n'
  }
})

const route = useRoute()
const toast = useToast()
const { fetchArticlePreviewById, updateArticle } = useArticles()
const { uploadMedia } = useMedia()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1338'

const originalArticle = ref(null)
const editableArticle = ref(null)
const editorContent = ref('')
const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const error = ref(null)
const hasChanges = ref(false)
const isModified = ref(false)
const imageInput = ref(null)
const mainEditorRef = ref(null)

const splashImageUrl = computed(() => {
  if (!editableArticle.value?.Splash) return null
  if (typeof editableArticle.value.Splash === 'object' && editableArticle.value.Splash.url) {
    if (editableArticle.value.Splash.url.startsWith('/')) return `${API_BASE_URL}${editableArticle.value.Splash.url}`
    return editableArticle.value.Splash.url
  }
  if (typeof editableArticle.value.Splash === 'string') return editableArticle.value.Splash
  return null
})

const formattedDate = computed({
  get() {
    if (!editableArticle.value?.Date) return ''
    return new Date(editableArticle.value.Date).toISOString().split('T')[0]
  },
  set(value) { editableArticle.value.Date = value }
})

const markChanged = () => { hasChanges.value = true }
const openPreview = () => {
  const id = route.params.id
  const params = new URLSearchParams(window.location.search)
  params.set('token', generateToken())
  window.open(`/previewreadonly/${id}?${params.toString()}`, '_blank')
}

const addCategory = () => { if (!editableArticle.value.Categories) editableArticle.value.Categories = []; editableArticle.value.Categories.push(''); markChanged() }
const removeCategory = (index) => { editableArticle.value.Categories.splice(index, 1); markChanged() }
const addAuthor = () => { if (!editableArticle.value.Authors) editableArticle.value.Authors = []; editableArticle.value.Authors.push({ title: '' }); markChanged() }
const removeAuthor = (index) => { editableArticle.value.Authors.splice(index, 1); markChanged() }
const addTag = () => { if (!editableArticle.value.Tags) editableArticle.value.Tags = []; editableArticle.value.Tags.push(''); markChanged() }
const removeTag = (index) => { editableArticle.value.Tags.splice(index, 1); markChanged() }
const triggerImageUpload = () => { imageInput.value.click() }

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  uploading.value = true
  try {
    editableArticle.value.Splash = await uploadMedia(file)
    markChanged()
    toast.add({ title: 'Image uploaded successfully!', color: 'green' })
  } catch (err) {
    toast.add({ title: `Failed to upload image: ${err.message}`, color: 'red' })
  } finally { uploading.value = false }
}

const removeImage = () => { editableArticle.value.Splash = null; if (imageInput.value) imageInput.value.value = ''; markChanged() }

const saveArticle = async () => {
  saving.value = true
  try {
    const id = route.params.id
    const markdownContent = turndownService.turndown(editorContent.value || '')
    const dataToSave = {
      Title: editableArticle.value.Title, Abstract: editableArticle.value.Abstract,
      Markdown: markdownContent, Date: editableArticle.value.Date,
      Categories: editableArticle.value.Categories?.filter(c => c.trim() !== ''),
      Tags: editableArticle.value.Tags?.filter(t => t.trim() !== ''),
      Authors: editableArticle.value.Authors?.filter(a => a.title?.trim() !== ''),
      Funding: editableArticle.value.Funding, Citation: editableArticle.value.Citation,
      Doi: editableArticle.value.Doi, Splash: editableArticle.value.Splash
    }
    const updatedArticle = await updateArticle(id, dataToSave, 'draft')
    originalArticle.value = JSON.parse(JSON.stringify(updatedArticle))
    editableArticle.value = updatedArticle
    hasChanges.value = false; isModified.value = true
    toast.add({ title: 'Article saved as draft. Preview and publish when ready.', color: 'green' })
  } catch (err) {
    toast.add({ title: `Failed to save: ${err.message}`, color: 'red' })
  } finally { saving.value = false }
}

const fixAssetUrls = (html) => html ? html.replace(/(src=["'])(\/[^"']*["'])/g, `$1${API_BASE_URL}$2`) : html

const convertMarkdownToHtml = (markdown) => {
  if (!markdown) return ''
  marked.use(markedFootnote())
  marked.setOptions({ gfm: true, breaks: false, html: true })
  markdown = markdown.replace(/([^\n])\[\^(\d+)\]:/g, '$1\n\n[^$2]:')
  markdown = markdown.replace(/(\[\^\d+\]:[^\n]*)\n(?!\[\^\d+\]:|\s*$|\n)([^\n]+)/g, '$1 $2')
  let html = marked(markdown)
  html = html.replace(/<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/g, '<li>$1</li>')
  html = html.replace(/ title="_blank"/g, ' target="_blank" rel="noopener noreferrer"')
  return fixAssetUrls(html)
}

const loadArticle = async () => {
  loading.value = true; error.value = null
  try {
    const id = route.params.id
    const data = await fetchArticlePreviewById(id)
    originalArticle.value = JSON.parse(JSON.stringify(data))
    editableArticle.value = data
    if (data.publishedAt === null || route.query.status === 'draft') isModified.value = true
    if (data.Markdown) editorContent.value = convertMarkdownToHtml(data.Markdown)
  } catch (err) {
    error.value = `Failed to load article: ${err.message}`
  } finally { loading.value = false }
}

const handleBeforeUnload = (e) => { if (hasChanges.value) { e.preventDefault(); e.returnValue = '' } }

useAsyncData(`article-editor-${route.params.id}`, () => loadArticle(), { server: false })

watchEffect((onCleanup) => {
  if (!import.meta.client) return
  window.addEventListener('beforeunload', handleBeforeUnload)
  onCleanup(() => window.removeEventListener('beforeunload', handleBeforeUnload))
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
