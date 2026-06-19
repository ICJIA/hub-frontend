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
              <div v-for="(category, index) in editableArticle.categories" :key="index" class="relative">
                <UInput v-model="editableArticle.categories[index]" @input="markChanged" size="sm" class="w-40 pr-7" />
                <button class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="removeCategory(index)">
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
              </div>
              <UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addCategory">Add Category</UButton>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Title</label>
            <UInput v-model="editableArticle.title" @input="markChanged" placeholder="Article Title" />
          </div>

          <div class="mb-6">
            <label class="field-label">Date</label>
            <UInput v-model="formattedDate" type="date" @input="markChanged" class="max-w-[220px]" />
          </div>

          <div class="mb-6">
            <label class="field-label">Authors</label>
            <div class="flex flex-col gap-2">
              <div v-for="(author, index) in editableArticle.authors" :key="index" class="flex items-center gap-2">
                <UInput v-model="editableArticle.authors[index].title" @input="markChanged" size="sm" placeholder="Author name" class="flex-1" />
                <UButton icon="i-heroicons-x-mark" size="sm" variant="ghost" @click="removeAuthor(index)" />
              </div>
              <div><UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addAuthor">Add Author</UButton></div>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Splash Image</label>
            <div v-if="splashImageUrl" class="mb-3">
              <img :src="splashImageUrl" :alt="editableArticle.title" class="max-h-[200px] max-w-[350px] rounded mb-2 object-cover" />
              <UButton size="sm" color="error" variant="soft" @click="removeImage">Remove Image</UButton>
            </div>
            <input type="file" @change="handleImageUpload" accept="image/*" ref="imageInput" class="hidden" :disabled="uploading" />
            <UButton size="sm" variant="outline" :loading="uploading" @click="triggerImageUpload">
              {{ splashImageUrl ? 'Change Image' : 'Upload Image' }}
            </UButton>
          </div>

          <div class="mb-6">
            <label class="field-label">Abstract / Summary</label>
            <RichTextEditor v-model="editableArticle.abstract" @update:modelValue="markChanged" :minHeight="150" :showAllTools="false" />
          </div>

          <div class="mb-6">
            <label class="field-label">Article Content</label>
            <RichTextEditor ref="mainEditorRef" v-model="editorContent" @update:modelValue="markChanged" :minHeight="400" :showAllTools="true" :markdown="true" />
          </div>

          <div class="mb-6">
            <label class="field-label">Tags</label>
            <div class="flex flex-wrap gap-2 items-center">
              <div v-for="(tag, index) in editableArticle.tags" :key="index" class="relative">
                <UInput v-model="editableArticle.tags[index]" @input="markChanged" size="sm" class="w-36 pr-7" />
                <button class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" @click="removeTag(index)">
                  <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
                </button>
              </div>
              <UButton size="sm" variant="soft" icon="i-heroicons-plus" @click="addTag">Add Tag</UButton>
            </div>
          </div>

          <div class="mb-6">
            <label class="field-label">Funding</label>
            <RichTextEditor v-model="editableArticle.funding" @update:modelValue="markChanged" :minHeight="150" :showAllTools="false" />
          </div>

          <div class="mb-6">
            <label class="field-label">Citation</label>
            <RichTextEditor v-model="editableArticle.citation" @update:modelValue="markChanged" :minHeight="150" :showAllTools="false" />
          </div>

          <div class="mb-6">
            <label class="field-label">DOI</label>
            <UInput v-model="editableArticle.doi" @input="markChanged" placeholder="DOI..." />
          </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ middleware: ['preview-access'], layout: 'preview' })

import TurndownService from 'turndown'
import { marked } from 'marked'
import markedFootnote from 'marked-footnote'
import DOMPurify from 'dompurify'

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

const { route, loading, saving, error, hasChanges, isModified, markChanged, openPreview, makeFormattedDate, checkDraftStatus } = usePreviewEditor('/previewreadonly')
const { fixAssetUrls, resolveImageUrl } = usePreviewUtils()
const toast = useToast()
const { fetchArticlePreviewById, updateArticle } = useArticles()
const { uploadMedia } = useMedia()

const originalArticle = ref(null)
const editableArticle = ref(null)
const editorContent = ref('')
const uploading = ref(false)
const imageInput = ref(null)
const mainEditorRef = ref(null)

const splashImageUrl = computed(() => resolveImageUrl(editableArticle.value?.splash))
const formattedDate = makeFormattedDate(editableArticle, 'date')

const addCategory = () => { if (!editableArticle.value.categories) editableArticle.value.categories = []; editableArticle.value.categories.push(''); markChanged() }
const removeCategory = (index) => { editableArticle.value.categories.splice(index, 1); markChanged() }
const addAuthor = () => { if (!editableArticle.value.authors) editableArticle.value.authors = []; editableArticle.value.authors.push({ title: '' }); markChanged() }
const removeAuthor = (index) => { editableArticle.value.authors.splice(index, 1); markChanged() }
const addTag = () => { if (!editableArticle.value.tags) editableArticle.value.tags = []; editableArticle.value.tags.push(''); markChanged() }
const removeTag = (index) => { editableArticle.value.tags.splice(index, 1); markChanged() }
const triggerImageUpload = () => { imageInput.value.click() }

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  uploading.value = true
  try {
    editableArticle.value.splash = await uploadMedia(file)
    markChanged()
    toast.add({ title: 'Image uploaded successfully!', color: 'green' })
  } catch (err) {
    toast.add({ title: `Failed to upload image: ${err.message}`, color: 'red' })
  } finally { uploading.value = false }
}

const removeImage = () => { editableArticle.value.splash = null; if (imageInput.value) imageInput.value.value = ''; markChanged() }

const saveArticle = async () => {
  saving.value = true
  try {
    const markdownContent = turndownService.turndown(editorContent.value || '')
    const dataToSave = {
      title: editableArticle.value.title, abstract: editableArticle.value.abstract,
      markdown: markdownContent, date: editableArticle.value.date,
      categories: editableArticle.value.categories?.filter(c => c.trim() !== ''),
      tags: editableArticle.value.tags?.filter(t => t.trim() !== ''),
      authors: editableArticle.value.authors?.filter(a => a.title?.trim() !== ''),
      funding: editableArticle.value.funding, citation: editableArticle.value.citation,
      doi: editableArticle.value.doi, splash: editableArticle.value.splash
    }
    const updatedArticle = await updateArticle(route.params.id, dataToSave, 'draft')
    originalArticle.value = JSON.parse(JSON.stringify(updatedArticle))
    editableArticle.value = updatedArticle
    hasChanges.value = false; isModified.value = true
    toast.add({ title: 'Article saved as draft. Preview and publish when ready.', color: 'green' })
  } catch (err) {
    toast.add({ title: `Failed to save: ${err.message}`, color: 'red' })
  } finally { saving.value = false }
}

const convertMarkdownToHtml = (markdown) => {
  if (!markdown) return ''
  marked.use(markedFootnote())
  marked.setOptions({ gfm: true, breaks: false })
  markdown = markdown.replace(/([^\n])\[\^(\d+)\]:/g, '$1\n\n[^$2]:')
  markdown = markdown.replace(/(\[\^\d+\]:[^\n]*)\n(?!\[\^\d+\]:|\s*$|\n)([^\n]+)/g, '$1 $2')
  let html = DOMPurify.sanitize(marked(markdown), {
    ALLOWED_TAGS: ['p', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'img', 'hr', 'sup', 'sub', 'section', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'target', 'rel', 'id', 'class', 'title'],
  })
  html = html.replace(/<li>\s*<p>([\s\S]*?)<\/p>\s*<\/li>/g, '<li>$1</li>')
  html = html.replace(/ title="_blank"/g, ' target="_blank" rel="noopener noreferrer"')
  return fixAssetUrls(html)
}

const loadArticle = async () => {
  loading.value = true; error.value = null
  try {
    const data = await fetchArticlePreviewById(route.params.id)
    originalArticle.value = JSON.parse(JSON.stringify(data))
    editableArticle.value = data
    checkDraftStatus(data)
    if (data.markdown) editorContent.value = convertMarkdownToHtml(data.markdown)
  } catch (err) {
    error.value = `Failed to load article: ${err.message}`
  } finally { loading.value = false }
}

useAsyncData(`article-editor-${route.params.id}`, () => loadArticle(), { server: false })
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
