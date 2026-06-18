<template>
    <div class="rich-text-editor">
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <!-- Undo / Redo -->
        <div class="toolbar-group">
          <button @click="execCommand('undo')" class="toolbar-btn" title="Undo (Ctrl+Z)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 14 4 9 9 4"></polyline>
              <path d="M20 20v-7a4 4 0 0 0-4-4H4"></path>
            </svg>
          </button>
          <button @click="execCommand('redo')" class="toolbar-btn" title="Redo (Ctrl+Y)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 14 20 9 15 4"></polyline>
              <path d="M4 20v-7a4 4 0 0 1 4-4h12"></path>
            </svg>
          </button>
        </div>

        <div class="toolbar-divider"></div>

           <!-- Table -->
           <div class="toolbar-group">
          <div class="table-dropdown" ref="tableDropdownRef">
            <button @click="toggleTablePicker" class="toolbar-btn" title="Insert Table">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="3" y1="15" x2="21" y2="15"></line>
                <line x1="9" y1="3" x2="9" y2="21"></line>
                <line x1="15" y1="3" x2="15" y2="21"></line>
              </svg>
            </button>
            
            <!-- Grid Picker -->
            <div v-if="showTablePicker" class="table-picker">
              <div class="picker-header">{{ gridRows }} × {{ gridCols }}</div>
              <div class="picker-grid" @mouseleave="resetGrid">
                <div v-for="row in 8" :key="row" class="picker-row">
                  <div 
                    v-for="col in 8" 
                    :key="col"
                    class="picker-cell"
                    :class="{ active: row <= gridRows && col <= gridCols }"
                    @mouseenter="setGridSize(row, col)"
                    @click="insertTable"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <div class="toolbar-divider"></div>

        <!-- Text formatting -->
        <div class="toolbar-group">
          <button 
            v-if="showAllTools"
            @click="execCommand('formatBlock', 'h1')" 
            class="toolbar-btn"
            title="Heading 1"
          >H1</button>
          <button 
            v-if="showAllTools"
            @click="execCommand('formatBlock', 'h2')" 
            class="toolbar-btn"
            title="Heading 2"
          >H2</button>
          <button 
            v-if="showAllTools"
            @click="execCommand('formatBlock', 'h3')" 
            class="toolbar-btn"
            title="Heading 3"
          >H3</button>
          <button 
            v-if="showAllTools"
            @click="execCommand('formatBlock', 'p')" 
            class="toolbar-btn"
            title="Paragraph"
          >¶</button>
        </div>
  
        <div class="toolbar-divider" v-if="showAllTools"></div>
  
        <!-- Basic formatting -->
        <div class="toolbar-group">
          <button @click="execCommand('bold')" class="toolbar-btn" title="Bold">
            <strong>B</strong>
          </button>
          <button @click="execCommand('italic')" class="toolbar-btn" title="Italic">
            <em>I</em>
          </button>
          <button @click="execCommand('underline')" class="toolbar-btn" title="Underline">
            <u>U</u>
          </button>
          <button 
            v-if="showAllTools"
            @click="execCommand('strikeThrough')" 
            class="toolbar-btn" 
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>
  
        <div class="toolbar-divider"></div>
  
        <!-- Lists -->
        <div class="toolbar-group">
          <button @click="execCommand('insertUnorderedList')" class="toolbar-btn" title="Bullet List">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="9" y1="6" x2="20" y2="6"></line>
              <line x1="9" y1="12" x2="20" y2="12"></line>
              <line x1="9" y1="18" x2="20" y2="18"></line>
              <circle cx="4" cy="6" r="2" fill="currentColor"></circle>
              <circle cx="4" cy="12" r="2" fill="currentColor"></circle>
              <circle cx="4" cy="18" r="2" fill="currentColor"></circle>
            </svg>
          </button>
          <button @click="execCommand('insertOrderedList')" class="toolbar-btn" title="Numbered List">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="10" y1="6" x2="21" y2="6"></line>
              <line x1="10" y1="12" x2="21" y2="12"></line>
              <line x1="10" y1="18" x2="21" y2="18"></line>
              <text x="2" y="8" font-size="8" fill="currentColor">1</text>
              <text x="2" y="14" font-size="8" fill="currentColor">2</text>
              <text x="2" y="20" font-size="8" fill="currentColor">3</text>
            </svg>
          </button>
        </div>
  
        <div class="toolbar-divider" v-if="showAllTools"></div>
  
        <!-- Block elements -->
        <div class="toolbar-group" v-if="showAllTools">
          <button @click="execCommand('formatBlock', 'blockquote')" class="toolbar-btn" title="Quote">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21"></path>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3"></path>
            </svg>
          </button>
          <button @click="insertCodeBlock" class="toolbar-btn" title="Code Block">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </button>
        </div>
  
        <div class="toolbar-divider"></div>
  
        <!-- Link & Image -->
        <div class="toolbar-group">
          <button @click="openMediaDialog('image')" class="toolbar-btn" title="Insert Image from Media Library">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </button>
          <button @click="openMediaDialog('file')" class="toolbar-btn" title="Insert File Link from Media Library">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="9" y1="13" x2="15" y2="13"></line>
              <line x1="9" y1="17" x2="15" y2="17"></line>
            </svg>
          </button>
          <button @click="insertLink" class="toolbar-btn" title="Insert Link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </button>
          <button @click="execCommand('unlink')" class="toolbar-btn" title="Remove Link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              <line x1="2" y1="2" x2="22" y2="22"></line>
            </svg>
          </button>
        </div>
  
        <div class="toolbar-divider"></div>
  
     

        <!-- Clear formatting -->
        <div class="toolbar-group">
          <button @click="clearFormatting" class="toolbar-btn" title="Clear Formatting">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- HTML / Rich Text toggle -->
        <div class="toolbar-group">
          <button
            @click="toggleHtmlMode"
            class="toolbar-btn toolbar-btn-wide"
            :class="{ 'toolbar-btn-active': htmlMode }"
            :title="htmlMode ? 'Switch to Rich Text' : (markdown ? 'Switch to Markdown' : 'Switch to HTML')"
          >
            <!-- Markdown icon: M with down arrow -->
            <svg v-if="markdown" width="20" height="14" viewBox="0 0 208 128">
              <rect width="198" height="118" x="5" y="5" rx="10" ry="10" fill="none" stroke="currentColor" stroke-width="10"/>
              <path d="M30 98V30h20l20 25 20-25h20v68H90V59L70 84 50 59v39zm125 0l-30-33h20V30h20v35h20z" fill="currentColor"/>
            </svg>
            <!-- HTML icon: </> -->
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </button>
        </div>
      </div>
  
      <!-- Editor Content (Rich Text mode) -->
      <div
        v-show="!htmlMode"
        ref="editorRef"
        class="editor-content"
        contenteditable="true"
        @input="onInput"
        @paste="onPaste"
        @keydown="onKeydown"
        @contextmenu="onContextMenu"
        @mouseover="onEditorMouseover"
        @mouseleave="scheduleHideImageOverlay"
        :style="{ minHeight: minHeight + 'px' }"
      ></div>

      <!-- Editor Content (HTML source mode) -->
      <textarea
        v-show="htmlMode"
        ref="htmlTextareaRef"
        class="editor-html-source"
        :style="{ minHeight: minHeight + 'px' }"
        @input="onHtmlSourceInput"
      ></textarea>

      <!-- Image delete overlay -->
      <div
        v-if="hoveredImage"
        class="image-overlay"
        :style="{ top: imageOverlayPos.top + 'px', left: imageOverlayPos.left + 'px' }"
        @mouseenter="cancelHideImageOverlay"
        @mouseleave="scheduleHideImageOverlay"
      >
        <button class="image-remove-btn" @mousedown.prevent="removeHoveredImage" title="Remove image">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Link Dialog -->
      <div v-if="showLinkDialog" class="link-dialog-overlay" @click.self="cancelLink">
        <div class="link-dialog">
          <h3 class="link-dialog-title">Insert Link</h3>
          <div class="link-dialog-field">
            <label>URL</label>
            <input
              ref="linkUrlInputRef"
              v-model="linkUrl"
              type="url"
              placeholder="https://example.com"
              class="link-dialog-input"
              @keydown.enter="confirmLink"
              @keydown.esc="cancelLink"
            />
          </div>
          <div class="link-dialog-field link-dialog-checkbox">
            <label>
              <input type="checkbox" v-model="linkOpenInNewTab" />
              Open in new tab
            </label>
          </div>
          <div class="link-dialog-actions">
            <button @click="cancelLink" class="link-dialog-btn cancel">Cancel</button>
            <button @click="confirmLink" class="link-dialog-btn confirm">Insert</button>
          </div>
        </div>
      </div>

      <!-- Media Picker Dialog -->
      <div v-if="showMediaDialog" class="media-dialog-overlay" @click.self="closeMediaDialog">
        <div class="media-dialog">
          <div class="media-dialog-header">
            <h3 class="media-dialog-title">{{ mediaDialogMode === 'image' ? 'Media Library — Images' : 'Media Library — Files' }}</h3>
            <button @click="closeMediaDialog" class="media-dialog-close" title="Close">&times;</button>
          </div>
          <div class="media-dialog-search">
            <input
              v-model="mediaSearch"
              type="text"
              :placeholder="mediaDialogMode === 'image' ? 'Search images...' : 'Search files...'"
              class="media-search-input"
              @input="onMediaSearch"
            />
          </div>
          <div class="media-dialog-body">
            <div v-if="mediaLoading && mediaFiles.length === 0" class="media-loading">
              Loading...
            </div>
            <div v-else-if="mediaFiles.length === 0" class="media-empty">
              {{ mediaDialogMode === 'image' ? 'No images found.' : 'No files found.' }}
            </div>
            <div v-else class="media-grid" :class="{ 'media-grid-files': mediaDialogMode === 'file' }">
              <div
                v-for="file in mediaFiles"
                :key="file.id"
                class="media-item"
                :class="{ 'media-item-file': mediaDialogMode === 'file' }"
                @click="selectMedia(file)"
                :title="file.name"
              >
                <!-- Image mode: show thumbnail -->
                <template v-if="mediaDialogMode === 'image'">
                  <img :src="getThumbnailUrl(file)" :alt="file.name" class="media-thumb" />
                </template>
                <!-- File mode: show file icon + mime type -->
                <template v-else>
                  <div class="media-file-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span class="media-file-ext">{{ getFileExt(file) }}</span>
                  </div>
                </template>
                <span class="media-item-name">{{ file.name }}</span>
              </div>
            </div>
            <div v-if="mediaHasMore" class="media-load-more">
              <button @click="loadMoreMedia" class="media-load-more-btn" :disabled="mediaLoading">
                {{ mediaLoading ? 'Loading...' : 'Load More' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Table Context Menu -->
      <div
        v-if="showTableMenu"
        class="table-context-menu"
        :style="{ top: tableMenuPos.y + 'px', left: tableMenuPos.x + 'px' }"
      >
        <button @click="addRowAbove">Add Row Above</button>
        <button @click="addRowBelow">Add Row Below</button>
        <button @click="addColumnLeft">Add Column Left</button>
        <button @click="addColumnRight">Add Column Right</button>
        <div class="menu-divider"></div>
        <button @click="deleteRow" class="danger">Delete Row</button>
        <button @click="deleteColumn" class="danger">Delete Column</button>
        <button @click="deleteTable" class="danger">Delete Table</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import { marked } from 'marked'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
})
turndown.use(gfm)
  
  const props = defineProps({
    modelValue: {
      type: String,
      default: ''
    },
    minHeight: {
      type: Number,
      default: 300
    },
    showAllTools: {
      type: Boolean,
      default: true
    },
    markdown: {
      type: Boolean,
      default: false
    }
  })
  
  const emit = defineEmits(['update:modelValue'])
  
  const editorRef = ref(null)
  const tableDropdownRef = ref(null)
  const linkUrlInputRef = ref(null)
  const htmlTextareaRef = ref(null)

  // HTML source mode
  const htmlMode = ref(false)

  // Link dialog state
  const showLinkDialog = ref(false)
  const linkUrl = ref('')
  const linkOpenInNewTab = ref(false)
  let savedSelection = null

  // Table picker state
  const showTablePicker = ref(false)
  const gridRows = ref(1)
  const gridCols = ref(1)
  
  // Table context menu state
  const showTableMenu = ref(false)
  const tableMenuPos = reactive({ x: 0, y: 0 })
  const selectedTable = ref(null)
  const selectedCell = ref(null)
  
  // Initialize editor with content
  const initEditor = () => {
    if (editorRef.value && props.modelValue) {
      editorRef.value.innerHTML = props.modelValue
    }
  }
  
  // Watch for external changes
  watch(() => props.modelValue, (newVal) => {
    if (editorRef.value && editorRef.value.innerHTML !== newVal) {
      editorRef.value.innerHTML = newVal || ''
    }
  }, { immediate: false })
  
  // Execute document command
  const execCommand = (command, value = null) => {
    editorRef.value?.focus()
    document.execCommand(command, false, value)
    emitUpdate()
  }
  
  // Handle input
  const onInput = () => {
    emitUpdate()
  }
  
  // Emit update
  const emitUpdate = () => {
    if (editorRef.value) {
      emit('update:modelValue', editorRef.value.innerHTML)
    }
  }
  
  // Handle paste - clean up pasted content
  const onPaste = (e) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const plain = e.clipboardData.getData('text/plain')

    let content
    if (html) {
      const temp = document.createElement('div')
      temp.innerHTML = html
      temp.querySelectorAll('script, style').forEach(el => el.remove())
      // Unwrap span tags — keep their text content but drop the tag itself
      temp.querySelectorAll('span').forEach(span => {
        const parent = span.parentNode
        while (span.firstChild) parent.insertBefore(span.firstChild, span)
        parent.removeChild(span)
      })
      content = temp.innerHTML
    } else {
      // Fall back to plain text, preserving newlines as <br>
      content = plain
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>')
    }

    document.execCommand('insertHTML', false, content)
    emitUpdate()
  }

  // Clear all inline and block-level formatting from the current selection
  const clearFormatting = () => {
    editorRef.value?.focus()
    document.execCommand('removeFormat', false, null)
    document.execCommand('formatBlock', false, 'p')
    emitUpdate()
  }
  
  // Handle keydown for special behaviors
  const onKeydown = (e) => {
    // Tab in table moves to next cell
    if (e.key === 'Tab') {
      const cell = getParentCell()
      if (cell) {
        e.preventDefault()
        const nextCell = e.shiftKey ? getPreviousCell(cell) : getNextCell(cell)
        if (nextCell) {
          selectCellContent(nextCell)
        }
      }
    }
  }
  
  // Get parent table cell
  const getParentCell = () => {
    const selection = window.getSelection()
    if (!selection.rangeCount) return null
    
    let node = selection.anchorNode
    while (node && node !== editorRef.value) {
      if (node.nodeName === 'TD' || node.nodeName === 'TH') {
        return node
      }
      node = node.parentNode
    }
    return null
  }
  
  // Get next cell
  const getNextCell = (cell) => {
    if (cell.nextElementSibling) {
      return cell.nextElementSibling
    }
    const row = cell.parentElement
    if (row.nextElementSibling) {
      return row.nextElementSibling.cells[0]
    }
    return null
  }
  
  // Get previous cell
  const getPreviousCell = (cell) => {
    if (cell.previousElementSibling) {
      return cell.previousElementSibling
    }
    const row = cell.parentElement
    if (row.previousElementSibling) {
      const prevRow = row.previousElementSibling
      return prevRow.cells[prevRow.cells.length - 1]
    }
    return null
  }
  
  // Select cell content
  const selectCellContent = (cell) => {
    const range = document.createRange()
    range.selectNodeContents(cell)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
  }
  
  // Image overlay state
  const hoveredImage = ref(null)
  const imageOverlayPos = reactive({ top: 0, left: 0 })
  let hideImageOverlayTimeout = null

  const onEditorMouseover = (e) => {
    if (e.target.tagName === 'IMG') {
      cancelHideImageOverlay()
      hoveredImage.value = e.target
      const rect = e.target.getBoundingClientRect()
      imageOverlayPos.top = rect.top + 6
      imageOverlayPos.left = rect.right - 34
    } else if (hoveredImage.value && !e.target.closest('.image-overlay')) {
      scheduleHideImageOverlay()
    }
  }

  const scheduleHideImageOverlay = () => {
    hideImageOverlayTimeout = setTimeout(() => {
      hoveredImage.value = null
    }, 150)
  }

  const cancelHideImageOverlay = () => {
    clearTimeout(hideImageOverlayTimeout)
  }

  const removeHoveredImage = () => {
    if (hoveredImage.value) {
      hoveredImage.value.remove()
      hoveredImage.value = null
      emitUpdate()
    }
  }

  // Media picker state
  const showMediaDialog = ref(false)
  const mediaDialogMode = ref('image') // 'image' | 'file'
  const mediaFiles = ref([])
  const mediaLoading = ref(false)
  const mediaSearch = ref('')
  const mediaPage = ref(1)
  const mediaHasMore = ref(false)
  let mediaSearchTimeout = null

  const getThumbnailUrl = (file) => {
    const url = file.formats?.thumbnail?.url ?? file.url
    return url.startsWith('/') ? `${API_BASE_URL}${url}` : url
  }

  const getFileExt = (file) => {
    return file.name.split('.').pop().toUpperCase().slice(0, 4)
  }

  const fetchMedia = async (append = false) => {
    mediaLoading.value = true
    try {
      const result = await fetchMediaFiles(mediaPage.value, 20, mediaSearch.value, mediaDialogMode.value)
      mediaFiles.value = append ? [...mediaFiles.value, ...result.files] : result.files
      mediaHasMore.value = result.hasMore
    } catch (err) {
      console.error('Failed to fetch media:', err)
    } finally {
      mediaLoading.value = false
    }
  }

  const openMediaDialog = (mode = 'image') => {
    const selection = window.getSelection()
    savedSelection = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null
    mediaDialogMode.value = mode
    mediaFiles.value = []
    mediaSearch.value = ''
    mediaPage.value = 1
    mediaHasMore.value = false
    showMediaDialog.value = true
    fetchMedia()
  }

  const closeMediaDialog = () => {
    showMediaDialog.value = false
  }

  const onMediaSearch = () => {
    clearTimeout(mediaSearchTimeout)
    mediaSearchTimeout = setTimeout(() => {
      mediaPage.value = 1
      fetchMedia()
    }, 300)
  }

  const loadMoreMedia = () => {
    mediaPage.value++
    fetchMedia(true)
  }

  const selectMedia = (file) => {
    const url = file.url.startsWith('/') ? `${API_BASE_URL}${file.url}` : file.url
    showMediaDialog.value = false
    editorRef.value?.focus()
    const selection = window.getSelection()
    selection.removeAllRanges()
    if (savedSelection) selection.addRange(savedSelection)
    if (mediaDialogMode.value === 'image') {
      const img = document.createElement('img')
      img.src = url
      img.alt = file.name
      img.style.maxWidth = '100%'
      const range = window.getSelection()?.getRangeAt(0)
      if (range) {
        range.deleteContents()
        range.insertNode(img)
        range.setStartAfter(img)
        range.collapse(true)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(range)
      }
    } else {
      const a = document.createElement('a')
      a.href = url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.textContent = file.name
      const range = window.getSelection()?.getRangeAt(0)
      if (range) {
        range.deleteContents()
        range.insertNode(a)
        range.setStartAfter(a)
        range.collapse(true)
        window.getSelection()?.removeAllRanges()
        window.getSelection()?.addRange(range)
      }
    }
    emitUpdate()
  }

  // Insert link
  const insertLink = () => {
    const selection = window.getSelection()
    savedSelection = selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null
    linkUrl.value = ''
    linkOpenInNewTab.value = false
    showLinkDialog.value = true
    nextTick(() => linkUrlInputRef.value?.focus())
  }

  const confirmLink = () => {
    const url = linkUrl.value.trim()
    showLinkDialog.value = false
    if (!url) return

    editorRef.value?.focus()
    const selection = window.getSelection()
    selection.removeAllRanges()
    if (savedSelection) selection.addRange(savedSelection)

    document.execCommand('createLink', false, url)

    if (linkOpenInNewTab.value) {
      // Find the newly created <a> and set target/rel
      const sel = window.getSelection()
      if (sel.rangeCount) {
        let node = sel.anchorNode
        while (node && node !== editorRef.value) {
          if (node.nodeName === 'A') {
            node.setAttribute('target', '_blank')
            node.setAttribute('rel', 'noopener noreferrer')
            break
          }
          node = node.parentNode
        }
      }
    }
    emitUpdate()
  }

  const cancelLink = () => {
    showLinkDialog.value = false
  }
  
  // Toggle source mode (Markdown or HTML depending on prop)
  const toggleHtmlMode = () => {
    if (htmlMode.value) {
      // Switching from source back to rich text
      if (editorRef.value && htmlTextareaRef.value) {
        const source = htmlTextareaRef.value.value
        editorRef.value.innerHTML = props.markdown ? marked.parse(source) : source
        emitUpdate()
      }
    } else {
      // Switching from rich text to source
      if (editorRef.value && htmlTextareaRef.value) {
        htmlTextareaRef.value.value = props.markdown
          ? turndown.turndown(editorRef.value.innerHTML)
          : editorRef.value.innerHTML
      }
    }
    htmlMode.value = !htmlMode.value
  }

  // Handle typing in source textarea
  const onHtmlSourceInput = () => {
    if (htmlTextareaRef.value && editorRef.value) {
      const source = htmlTextareaRef.value.value
      editorRef.value.innerHTML = props.markdown ? marked.parse(source) : source
      emitUpdate()
    }
  }

  // Insert code block
  const insertCodeBlock = () => {
    const pre = document.createElement('pre')
    pre.innerHTML = '<code>// Code here</code>'
    insertNodeAtCursor(pre)
    emitUpdate()
  }
  
  // Insert node at cursor
  const insertNodeAtCursor = (node) => {
    const selection = window.getSelection()
    if (selection.rangeCount) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(node)
      range.setStartAfter(node)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }
  
  // Table picker functions
  const toggleTablePicker = () => {
    showTablePicker.value = !showTablePicker.value
    if (showTablePicker.value) {
      gridRows.value = 1
      gridCols.value = 1
    }
  }
  
  const setGridSize = (row, col) => {
    gridRows.value = row
    gridCols.value = col
  }
  
  const resetGrid = () => {
    // Keep current selection
  }
  
  // Insert table
  const insertTable = () => {
    const table = document.createElement('table')

    // First row becomes the header (thead > tr > th)
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    for (let j = 0; j < gridCols.value; j++) {
      const th = document.createElement('th')
      th.innerHTML = '&nbsp;'
      headerRow.appendChild(th)
    }
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Remaining rows go in tbody (if more than 1 row selected)
    if (gridRows.value > 1) {
      const tbody = document.createElement('tbody')
      for (let i = 1; i < gridRows.value; i++) {
        const tr = document.createElement('tr')
        for (let j = 0; j < gridCols.value; j++) {
          const td = document.createElement('td')
          td.innerHTML = '&nbsp;'
          tr.appendChild(td)
        }
        tbody.appendChild(tr)
      }
      table.appendChild(tbody)
    }
    
    editorRef.value?.focus()
    insertNodeAtCursor(table)
    
    // Add paragraph after table
    const p = document.createElement('p')
    p.innerHTML = '<br>'
    table.after(p)
    
    showTablePicker.value = false
    emitUpdate()
  }
  
  // Context menu handler
  const onContextMenu = (e) => {
    const cell = e.target.closest('td, th')
    const table = e.target.closest('table')
    
    if (cell && table) {
      e.preventDefault()
      selectedTable.value = table
      selectedCell.value = cell
      tableMenuPos.x = e.clientX
      tableMenuPos.y = e.clientY
      showTableMenu.value = true
    }
  }
  
  // Table manipulation functions
  const addRowAbove = () => {
    if (!selectedCell.value) return
    const row = selectedCell.value.parentElement
    const isInThead = row.parentElement.tagName === 'THEAD'
    // New rows always use <td> and go in <tbody>
    const newRow = document.createElement('tr')
    for (let i = 0; i < row.cells.length; i++) {
      const td = document.createElement('td')
      td.innerHTML = '&nbsp;'
      newRow.appendChild(td)
    }
    if (isInThead) {
      // Insert at the start of tbody (or create one)
      let tbody = selectedTable.value.querySelector('tbody')
      if (!tbody) {
        tbody = document.createElement('tbody')
        selectedTable.value.appendChild(tbody)
      }
      tbody.insertBefore(newRow, tbody.firstChild)
    } else {
      row.before(newRow)
    }
    closeTableMenu()
  }

  const addRowBelow = () => {
    if (!selectedCell.value) return
    const row = selectedCell.value.parentElement
    const isInThead = row.parentElement.tagName === 'THEAD'
    const newRow = document.createElement('tr')
    for (let i = 0; i < row.cells.length; i++) {
      const td = document.createElement('td')
      td.innerHTML = '&nbsp;'
      newRow.appendChild(td)
    }
    if (isInThead) {
      // Insert at the start of tbody (or create one)
      let tbody = selectedTable.value.querySelector('tbody')
      if (!tbody) {
        tbody = document.createElement('tbody')
        selectedTable.value.appendChild(tbody)
      }
      tbody.insertBefore(newRow, tbody.firstChild)
    } else {
      row.after(newRow)
    }
    closeTableMenu()
  }

  const addColumnLeft = () => {
    if (!selectedTable.value || !selectedCell.value) return
    const cellIndex = selectedCell.value.cellIndex
    selectedTable.value.querySelectorAll('tr').forEach(row => {
      const isHeader = row.parentElement.tagName === 'THEAD'
      const newCell = document.createElement(isHeader ? 'th' : 'td')
      newCell.innerHTML = '&nbsp;'
      row.insertBefore(newCell, row.cells[cellIndex])
    })
    closeTableMenu()
  }

  const addColumnRight = () => {
    if (!selectedTable.value || !selectedCell.value) return
    const cellIndex = selectedCell.value.cellIndex
    selectedTable.value.querySelectorAll('tr').forEach(row => {
      const isHeader = row.parentElement.tagName === 'THEAD'
      const newCell = document.createElement(isHeader ? 'th' : 'td')
      newCell.innerHTML = '&nbsp;'
      const nextCell = row.cells[cellIndex + 1]
      if (nextCell) {
        row.insertBefore(newCell, nextCell)
      } else {
        row.appendChild(newCell)
      }
    })
    closeTableMenu()
  }

  const deleteRow = () => {
    if (!selectedCell.value) return
    const row = selectedCell.value.parentElement
    const section = row.parentElement
    const isInThead = section.tagName === 'THEAD'
    if (isInThead) {
      // Don't delete the header row — delete the whole table instead
      selectedTable.value?.remove()
    } else if (section.rows.length > 1) {
      row.remove()
    } else {
      // Last body row — remove the whole table
      selectedTable.value?.remove()
    }
    closeTableMenu()
  }
  
  const deleteColumn = () => {
    if (!selectedTable.value || !selectedCell.value) return
    const cellIndex = selectedCell.value.cellIndex
    const rows = selectedTable.value.querySelectorAll('tr')
    if (rows[0]?.cells.length > 1) {
      rows.forEach(row => row.cells[cellIndex]?.remove())
    } else {
      selectedTable.value.remove()
    }
    closeTableMenu()
  }
  
  const deleteTable = () => {
    selectedTable.value?.remove()
    closeTableMenu()
  }
  
  const closeTableMenu = () => {
    showTableMenu.value = false
    emitUpdate()
  }
  
  // Close menus on outside click
  const handleOutsideClick = (e) => {
    if (showTableMenu.value && !e.target.closest('.table-context-menu')) {
      showTableMenu.value = false
    }
    if (showTablePicker.value && !e.target.closest('.table-dropdown')) {
      showTablePicker.value = false
    }
  }
  
  onMounted(() => {
    initEditor()
    document.addEventListener('click', handleOutsideClick)
  })
  
  onBeforeUnmount(() => {
    document.removeEventListener('click', handleOutsideClick)
  })
  
  // Expose methods
  defineExpose({
    getContent: () => editorRef.value?.innerHTML || '',
    setContent: (html) => {
      if (editorRef.value) {
        editorRef.value.innerHTML = html
      }
    }
  })
  </script>
  
  <!-- Styles are in src/style.css -->