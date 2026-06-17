<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">

    <!-- ══════════════════════════════════════════════════
         PAGE HEADER — white, icon + title + tagline
    ═══════════════════════════════════════════════════ -->
    <div class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-[1300px] mx-auto px-4 sm:px-6 pt-6 pb-5">
        <div class="flex items-start gap-4">
          <div class="w-11 h-11 rounded-lg bg-primary-600 flex items-center justify-center shrink-0 mt-0.5">
            <UIcon :name="program.icon" class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {{ program.title }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ program.tagline }}</p>
          </div>
        </div>
      </div>
      <div class="h-[1px] w-full bg-gray-200 dark:bg-gray-700" />
    </div>

    <!-- ══════════════════════════════════════════════════
         MAIN CONTENT — two-column layout
    ═══════════════════════════════════════════════════ -->
    <div class="flex-1 bg-gray-50 dark:bg-gray-950">
      <div class="max-w-[1300px] mx-auto px-4 sm:px-6 py-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-start">

          <!-- ── Left: Body Content ── -->
          <div class="flex-1 min-w-0 space-y-6">
            <!-- Body paragraphs -->
            <div
              v-for="(paragraph, i) in program.body"
              :key="i"
              class="text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]"
            >
              {{ paragraph }}
            </div>

            <!-- Project Manager -->
            <div v-if="program.projectManager" class="pt-2">
              <span class="font-bold text-gray-900 dark:text-white">Project Manager:</span>
              <span class="text-gray-700 dark:text-gray-300 ml-1">{{ program.projectManager }}</span>
            </div>
          </div>

          <!-- ── Right: Sidebar ── -->
          <div class="w-full lg:w-[280px] lg:flex-shrink-0 space-y-4">

            <!-- Major Projects in R&A -->
            <SidebarCard title="Major Projects in R&A">
              <ul class="space-y-1.5">
                <li v-for="project in allPrograms" :key="project.slug">
                  <NuxtLink
                    :to="`/projects/${project.slug}`"
                    class="block text-sm leading-snug py-0.5 transition-colors"
                    :class="project.slug === currentSlug
                      ? 'text-primary-600 dark:text-primary-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'"
                  >
                    {{ project.title }}
                  </NuxtLink>
                </li>
              </ul>
            </SidebarCard>

            <!-- Related Publications -->
            <SidebarCard title="Related Publications">
              <template #header-action>
                <NuxtLink to="/articles" class="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium flex items-center gap-0.5">
                  View All <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
                </NuxtLink>
              </template>

              <ul class="space-y-3">
                <li v-for="pub in visiblePublications" :key="pub.title">
                  <NuxtLink
                    :to="pub.url"
                    class="block text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 leading-snug transition-colors"
                  >
                    {{ pub.title }}
                  </NuxtLink>
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ pub.date }}</span>
                </li>
              </ul>

              <UButton
                v-if="program.publications.length > visibleCount"
                variant="outline"
                size="sm"
                block
                class="mt-4"
                @click="visibleCount += 4"
              >
                Load More
              </UButton>
            </SidebarCard>

          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════
         RELATED RESOURCES — card grid
    ═══════════════════════════════════════════════════ -->
    <div v-if="program.resources.length" class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div class="max-w-[1300px] mx-auto px-4 sm:px-6 py-8">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-5">Related Resources</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="resource in program.resources"
            :key="resource.title"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex flex-col gap-3"
          >
            <h3 class="font-bold text-gray-900 dark:text-white text-sm leading-snug">
              {{ resource.title }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">
              {{ resource.description }}
            </p>
            <div>
              <a
                :href="resource.pdfUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
const route = useRoute()
const currentSlug = computed(() => route.params.slug)

const { fetchProjects, fetchProjectBySlug } = useProjects()

// ─── All projects for the sidebar nav ────────────────────────────────────────
const { data: projectsData } = await useAsyncData('all-projects', fetchProjects)
const allPrograms = computed(() =>
  (projectsData.value ?? []).map(p => ({ slug: p.slug, title: p.Title ?? p.title ?? '' }))
)

// ─── Active project from Strapi ───────────────────────────────────────────────
const { data: projectData } = await useAsyncData(
  () => `project-${currentSlug.value}`,
  () => fetchProjectBySlug(currentSlug.value),
  { watch: [currentSlug] }
)

// Body is stored as a newline-separated string in Strapi; split into paragraphs.
function normalizeBody(body) {
  if (!body) return []
  if (Array.isArray(body)) {
    return body.map(b =>
      typeof b === 'string' ? b : (b.text ?? b.children?.[0]?.text ?? '')
    ).filter(Boolean)
  }
  return String(body).split(/\n\n|\n/).map(s => s.trim()).filter(Boolean)
}

// Normalise publications → { title, date, url }
function normalizePublications(pubs) {
  if (!Array.isArray(pubs)) return []
  return pubs.map(p => ({
    title: p.Title ?? p.title ?? p.name ?? '',
    date: p.date ?? '',
    url: p.url ?? (p.slug ? `/articles/${p.slug}` : '#')
  }))
}

// Normalise resources → { title, description, pdfUrl }
function normalizeResources(resources) {
  if (!Array.isArray(resources)) return []
  return resources.map(r => ({
    title: r.Title ?? r.title ?? '',
    description: r.Description ?? r.description ?? '',
    pdfUrl: r.pdfUrl ?? r.url ?? '#'
  }))
}

const FALLBACK = {
  icon: 'i-lucide-folder',
  title: 'Project Not Found',
  tagline: '',
  body: ['This project page could not be found.'],
  projectManager: null,
  publications: [],
  resources: [],
}

const program = computed(() => {
  const p = projectData.value
  if (!p) return FALLBACK
  const authors = Array.isArray(p.Authors) ? p.Authors : []
  return {
    icon: p.Icon ?? p.icon ?? 'i-lucide-folder',
    title: p.Title ?? p.title ?? '',
    tagline: p.SubTitle ?? p.tagline ?? p.description ?? '',
    body: normalizeBody(p.Body ?? p.body ?? p.content),
    projectManager: authors.length ? authors.join(', ') : (p.projectManager ?? null),
    publications: normalizePublications(p.publications ?? p.Publications ?? []),
    resources: normalizeResources(p.resources ?? p.Resources ?? []),
  }
})

// ─── Publications "load more" ─────────────────────────────────────────────────
const visibleCount = ref(4)
const visiblePublications = computed(() => program.value.publications.slice(0, visibleCount.value))

watch(currentSlug, () => { visibleCount.value = 4 })
</script>
