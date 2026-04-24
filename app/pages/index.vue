<template>
  <div>
    <!-- ══════════════════════════════════════════════════
         1. HERO — dark navy, full-width
    ═══════════════════════════════════════════════════ -->
    <div
      class="text-white bg-cover bg-top bg-no-repeat min-h-[355px]"
      style="background-image: url('/research-hub-hero-image.png');"
    >
      <div class="max-w-[1400px] mx-auto px-6 py-12 flex items-center justify-between gap-8">
        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-3 leading-tight">{{ currentPage.title }}</h1>
          <p class="text-white/75 text-base max-w-2xl leading-relaxed">{{ currentPage.subtitle }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center py-20 bg-white dark:bg-gray-950">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
      <p class="mt-4 text-gray-500">Loading page...</p>
    </div>

    <template v-else>

      <!-- ══════════════════════════════════════════════════
           2. RAU INFO BOX — white section, blue card
      ═══════════════════════════════════════════════════ -->
      <div class="bg-white dark:bg-gray-950 py-8">
        <div class="max-w-[1400px] mx-auto px-4">
          <div class="bg-white dark:bg-gray-950 p-6">
            <div class="flex gap-4">
              <UIcon name="i-lucide-landmark" class="w-8 h-8 shrink-0 dark:bg-gray-950 mt-1" />
              <div>
                <h2 class="text-xl font-bold mb-2">{{ currentPage.unitName }}</h2>
                <p class="dark:bg-gray-950 leading-relaxed text-sm">{{ currentPage.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════
           3. KEY STATISTICS — white section, navy cards
      ═══════════════════════════════════════════════════ -->
      <div class="bg-[#1a3a5c] py-8">
        <div class="max-w-[1400px] mx-auto px-4">
          <h2 class="text-xl font-bold mb-4 text-white">Key Statistics</h2>
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="stat in currentPage.statistics"
              :key="stat.label"
              class="bg-white rounded-lg overflow-hidden border-[10px] border-gray-200 flex flex-col"
            >
              <div class="bg-[#1a3a5c] px-5 py-4">
                <span class="text-4xl font-extrabold text-white">{{ stat.value }}</span>
              </div>
              <div class="px-5 py-4 flex flex-col flex-1">
                <h3 class="font-bold text-gray-900 mb-2 leading-snug">{{ stat.label }}</h3>
                <p class="text-sm text-gray-600 leading-relaxed flex-1">{{ stat.description }}</p>
                <a v-if="stat.url" :href="stat.url" class="mt-3 text-sm text-blue-700 hover:underline font-medium">Read More</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════
           4. PERSONS — light gray section, accordion list
      ═══════════════════════════════════════════════════ -->
      <div class="bg-gray-50 dark:bg-gray-900 py-8">
        <div class="max-w-[1400px] mx-auto px-4">
          <h2 class="text-xl font-bold mb-4">{{ currentPage.personsTitle }}</h2>
          <div class="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div
              v-for="person in currentPage.persons"
              :key="person.name"
            >
              <div
                class="flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                role="button"
                tabindex="0"
                :aria-expanded="!!person._open"
                @click="person._open = !person._open"
                @keydown.enter.prevent="person._open = !person._open"
                @keydown.space.prevent="person._open = !person._open"
              >
                <span class="font-medium text-sm">{{ person.name }}</span>
                <div class="flex items-center gap-3">
                  <span class="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{{ person.title }}</span>
                  <UIcon
                    :name="person._open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                    class="w-4 h-4 text-gray-400"
                  />
                </div>
              </div>
              <div
                v-if="person._open"
                class="px-5 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
              >
                {{ person.bio }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════
           5. LATEST ARTICLES — white section, 3-col grid
      ═══════════════════════════════════════════════════ -->
      <div class="bg-white dark:bg-gray-950 py-10">
        <div class="max-w-[1400px] mx-auto px-4">
          <h2 class="text-xl font-bold mb-6">Latest Articles</h2>
          <div class="grid grid-cols-12 gap-4 mb-6">
            <div
              v-for="article in displayArticles"
              :key="article.slug"
              class="col-span-12 sm:col-span-6 md:col-span-4"
            >
              <ContentCard
                :title="article.title"
                :date="article.date"
                :description="article.summary"
                :categories="article.categories"
                :image-url="article.imageUrl || null"
                view-mode="grid"
                @click="goToArticle(article.slug)"
              />
            </div>
          </div>
          <div class="flex justify-center">
            <UButton to="/articles" variant="outline" size="md">View All Articles</UButton>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════
           6. TOPICS — light gray section, bullet list + sidebar image
      ═══════════════════════════════════════════════════ -->
      <div class="bg-[#E6F1FA] dark:bg-gray-900 py-10">
        <div class="max-w-[1400px] mx-auto px-4">
          <div class="grid grid-cols-12 gap-8">
            <!-- Bullet list -->
            <div class="col-span-12 lg:col-span-7">
              <h2 class="text-xl font-bold mb-2">{{ currentPage.topicsTitle }}</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Browse research by topic area. Each topic links to filtered articles and resources from the Research and Analysis Unit.
              </p>
              <ul class="bg-white rounded-lg p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                <li
                  v-for="topic in currentPage.topics"
                  :key="topic.label"
                >
                  <NuxtLink
                    :to="`/articles?topic=${encodeURIComponent(topic.label)}`"
                    class="flex items-center gap-2 group"
                  >
                    <span class="w-2 h-2 rounded-full bg-blue-700 shrink-0" />
                    <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      {{ topic.label }}
                    </span>
                  </NuxtLink>
                </li>
              </ul>
            </div>
            <!-- Sidebar image -->
            <div class="col-span-12 lg:col-span-5">
              <div class="rounded-lg overflow-hidden h-full min-h-[220px] bg-gray-200 dark:bg-gray-700">
                <img
                  src="https://icjia.illinois.gov/researchhub/img/icjia-hero.jpg"
                  alt="ICJIA Research"
                  class="w-full h-full object-cover"
                  @error="(e) => e.target.style.display = 'none'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════
           7. LATEST RESOURCES — white section, 4-col icon cards
      ═══════════════════════════════════════════════════ -->
      <div class="bg-[#E6F1FA] dark:bg-gray-900 py-10">
        <div class="max-w-[1400px] mx-auto px-4">
          <h2 class="text-xl font-bold mb-6">{{ currentPage.resourcesTitle }}</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              v-for="resource in currentPage.resources"
              :key="resource.title"
              class="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-4"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center"
                  :class="resource.iconBg"
                >
                  <UIcon :name="resource.icon" class="w-6 h-6" :class="resource.iconColor" />
                </div>
                <div>
                  <p class="font-bold text-gray-900 text-sm leading-snug">{{ resource.title }}</p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ resource.subtitle }}</p>
                </div>
              </div>
              <UButton :to="resource.url" variant="outline" color="gray" block size="sm">View</UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════
           8. MAJOR PROJECTS — carousel
      ═══════════════════════════════════════════════════ -->
      <div class="bg-gray-50 py-10">
        <div class="max-w-[1400px] mx-auto px-4">
          <!-- Header -->
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-lg bg-[#1a3a5c] flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-white" />
            </div>
            <h2 class="text-xl font-bold text-gray-900">{{ currentPage.projectsTitle }}</h2>
          </div>
          <p class="text-sm text-gray-500 mb-6 max-w-2xl">{{ currentPage.projectsSubtitle }}</p>

          <!-- Carousel -->
          <UCarousel
            :items="currentPage.projects"
            arrows
            :ui="{
              item: 'basis-[340px]',
              container: 'gap-5',
            }"
          >
            <template #default="{ item: project }">
              <div class="rounded-xl overflow-hidden border border-gray-200 bg-white flex flex-col h-full">
                <!-- Coloured header -->
                <div class="p-5 flex flex-col justify-between min-h-[160px]" :class="project.headerBg">
                  <div class="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <UIcon :name="project.icon || 'i-lucide-folder'" class="w-5 h-5 text-white" />
                  </div>
                  <div class="mt-4">
                    <h3 class="font-bold text-white text-base leading-snug mb-2">{{ project.title }}</h3>
                    <span class="inline-block text-xs text-white/90 bg-white/20 rounded-full px-3 py-0.5">{{ project.category }}</span>
                  </div>
                </div>
                <!-- White body -->
                <div class="p-5 flex flex-col flex-1">
                  <p class="text-sm text-gray-600 leading-relaxed mb-4">{{ project.description }}</p>
                  <ul class="space-y-2 flex-1 mb-5">
                    <li v-for="bullet in project.bullets" :key="bullet" class="flex items-center gap-2 text-sm text-gray-700">
                      <UIcon name="i-lucide-check-circle-2" class="w-4 h-4 text-green-600 shrink-0" />
                      <span>{{ bullet }}</span>
                    </li>
                  </ul>
                  <div class="flex justify-end">
                    <UButton :to="project.url" variant="outline" color="gray" size="sm">Learn More</UButton>
                  </div>
                </div>
              </div>
            </template>
          </UCarousel>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// ─── Slug that maps to this page in Strapi's pages collection ───────────────
const PAGE_SLUG = 'test' // research-hub

// ─── Mock data — replaced by Strapi when the page is published ───────────────
const MOCK = {
  title: "ICJIA's Research Hub",
  subtitle: 'Illinois Criminal Justice Information Authority — Research and Analysis Unit. Serving as a national model for advancing criminal justice research, data, and policy.',
  unitName: 'Research and Analysis Unit',
  description:
    'The Research and Analysis Unit (RAU) at the Illinois Criminal Justice Information Authority (ICJIA) conducts research to improve the quality of justice and increase public safety in Illinois. The unit produces reports, datasets, and research-based resources to inform evidence-based policy and practice across the state.',
  statistics: [
    {
      value: '470',
      label: 'Uses Of Force in 2025',
      description: 'This number reflects the safe-T acts count of Use of Force. Which only include incidents in which a person was hospitalized or killed as a result of use of force.',
      url: '#'
    },
    {
      value: '28,000',
      label: 'Persons Arrested in 2025',
      description: 'This number reflects the safe-T acts count of Use of Force. Which only include incidents in which a person was hospitalized or killed as a result of use of force.',
      url: '#'
    },
    {
      value: '173,042',
      label: 'Reported Offences in 2025',
      description: 'This number reflects the safe-T acts count of Use of Force. Which only include incidents in which a person was hospitalized or killed as a result of use of force.',
      url: '#'
    }
  ],
  personsTitle: 'Persons in the Research and Analysis Unit',
  persons: [
    {
      name: 'Adam Langwith',
      title: 'Research Director',
      bio: 'Adam Langwith oversees the day-to-day operations of the Research and Analysis Unit. He has over 15 years of experience in criminal justice research and program evaluation, with a focus on data-driven policy development and cross-agency collaboration.'
    },
    {
      name: 'Alysson Gatens',
      title: 'Senior Research Analyst',
      bio: 'Alysson Gatens specializes in substance use policy, human trafficking, and crime victim research. She has published extensively on trauma-informed approaches and evidence-based interventions for vulnerable populations in the justice system.'
    },
    {
      name: 'Amanda Klump',
      title: 'Research Analyst',
      bio: "Amanda Klump conducts quantitative and qualitative research on juvenile justice, reentry, and community-based programming. She holds a Master's degree in criminology and has contributed to multiple statewide program evaluations."
    },
    {
      name: 'Janelle Vasquez',
      title: 'Policy Analyst',
      bio: 'Janelle Vasquez translates research findings into actionable policy recommendations for state and local agencies. Her background spans legislative analysis, stakeholder engagement, and grant program oversight across multiple justice domains.'
    },
    {
      name: 'Jessica Reichert',
      title: 'Senior Research Director',
      bio: "Jessica Reichert leads the unit's portfolio of federally funded research projects. With two decades of experience, she has directed major studies on homicide, domestic violence, human trafficking, and substance use disorder treatment outcomes."
    },
    {
      name: 'Malgorzata Davis',
      title: 'Senior Research Analyst',
      bio: 'Malgorzata Davis focuses on violence prevention, gun violence, and homicide research. She brings expertise in geospatial analysis and statistical modeling to support data-informed decision-making by law enforcement and community organizations.'
    },
    {
      name: 'Rebeccah Strandberg',
      title: 'Research Analyst',
      bio: "Rebeccah Strandberg supports the unit's work on mental health diversion, victimization, and restorative justice. She has a background in social work and applies mixed-methods research approaches to complex criminal justice questions."
    },
    {
      name: 'Samantha DiPietro',
      title: 'Research Analyst',
      bio: 'Samantha DiPietro conducts research on drug policy, incarceration trends, and reentry outcomes. She collaborates with partner agencies to develop data dashboards and visualizations that make research findings accessible to practitioners and policymakers.'
    }
  ].map(p => reactive({ ...p, _open: false })),
  topicsTitle: 'Topics in R&A',
  topics: [
    { label: 'Homicide' },
    { label: 'Gun Violence' },
    { label: 'Drug Policy' },
    { label: 'Human Trafficking' },
    { label: 'Mental Health' },
    { label: 'Juvenile Justice' },
    { label: 'Reentry' },
    { label: 'Victimization' },
    { label: 'Crime Analysis' }
  ],
  resourcesTitle: 'Latest Resources',
  resources: [
    { title: 'Datasets',   subtitle: 'Data Center Information',   icon: 'i-lucide-database',    iconBg: 'bg-green-100',   iconColor: 'text-green-700', url: '#' },
    { title: 'Dashboards', subtitle: 'Criminal Justice Records',  icon: 'i-lucide-bar-chart-2', iconBg: 'bg-[#1a3a5c]',   iconColor: 'text-white',     url: '#' },
    { title: 'Articles',   subtitle: 'Criminal Justice Articles', icon: 'i-lucide-newspaper',   iconBg: 'bg-red-700',     iconColor: 'text-white',     url: '#' },
    { title: 'Reports',    subtitle: 'Criminal Justice Reports',  icon: 'i-lucide-clipboard',   iconBg: 'bg-blue-700',    iconColor: 'text-white',     url: '#' }
  ],
  projectsTitle: 'Major Projects in R&A',
  projectsSubtitle: 'There are five centers in R&A that focus on different areas of the criminal justice system. Click the tiles to the left to get an overview of the centers and their research.',
  projects: [
    {
      title: 'Justice Counts Implementation Program',
      category: 'Justice Counts',
      headerBg: 'bg-[#1a3a5c]',
      icon: 'i-lucide-landmark',
      description: "ICJIA leads Illinois's participation in Justice Counts, a national initiative to standardize and publish criminal justice metrics across agencies.",
      bullets: ['Infrastructure Development', 'Installation Resilience', 'Community Partnership'],
      url: '#'
    },
    {
      title: 'Restore, Reinvest, Renew (R3)',
      category: 'Investment',
      headerBg: 'bg-red-800',
      icon: 'i-lucide-refresh-cw',
      description: "ICJIA leads Illinois's participation in Justice Counts, a national initiative to standardize and publish criminal justice metrics across agencies.",
      bullets: ['Sound Insulation', 'Noise Barriers', 'Community Impact'],
      url: '#'
    },
    {
      title: 'Deaths in Custody',
      category: 'Deaths',
      headerBg: 'bg-green-800',
      icon: 'i-lucide-file-text',
      description: "ICJIA leads Illinois's participation in Justice Counts, a national initiative to standardize and publish criminal justice metrics across agencies.",
      bullets: ['Sound Insulation', 'Noise Barriers', 'Community Impact'],
      url: '#'
    },
    {
      title: 'Illinois Uniform Crime Report',
      category: 'Crime Data',
      headerBg: 'bg-blue-900',
      icon: 'i-lucide-shield',
      description: "ICJIA leads Illinois's participation in Justice Counts, a national initiative to standardize and publish criminal justice metrics across agencies.",
      bullets: ['Annual statewide crime statistics', 'Law enforcement agency reporting', 'Trend analysis & visualization'],
      url: '#'
    },
    {
      title: 'Violence Prevention Research',
      category: 'Prevention',
      headerBg: 'bg-teal-800',
      icon: 'i-lucide-heart-handshake',
      description: "ICJIA leads Illinois's participation in Justice Counts, a national initiative to standardize and publish criminal justice metrics across agencies.",
      bullets: ['Evidence-based program evaluation', 'Community violence intervention', 'Policy recommendations'],
      url: '#'
    }
  ]
}

const MOCK_ARTICLES = [
  {
    slug: 'mock-1',
    title: 'Gun Violence Trends in Illinois: 2023 Annual Report',
    date: '2024-01-15',
    summary: 'A comprehensive review of gun-related incidents across Illinois counties, examining trends and policy implications.',
    categories: ['Gun Violence', 'Crime Analysis']
  },
  {
    slug: 'mock-2',
    title: 'Mental Health Diversion Programs: Outcomes and Best Practices',
    date: '2023-11-08',
    summary: 'Evaluation of diversion programs serving individuals with mental illness who encounter the criminal justice system.',
    categories: ['Mental Health', 'Juvenile Justice']
  },
  {
    slug: 'mock-3',
    title: 'Reentry Success Factors: A Statewide Analysis',
    date: '2023-09-20',
    summary: 'Examining individual and community-level factors that predict successful reintegration after incarceration.',
    categories: ['Reentry']
  },
  {
    slug: 'mock-4',
    title: 'Human Trafficking Identification and Reporting in Illinois',
    date: '2023-07-11',
    summary: 'Survey of law enforcement practices and training related to human trafficking identification across Illinois.',
    categories: ['Human Trafficking']
  },
  {
    slug: 'mock-5',
    title: 'Juvenile Diversion: Program Models and Recidivism',
    date: '2023-05-03',
    summary: 'Analysis of juvenile diversion program participation and its relationship to recidivism rates.',
    categories: ['Juvenile Justice', 'Reentry']
  },
  {
    slug: 'mock-6',
    title: 'Drug Policy Reform: Impact on Incarceration Rates',
    date: '2023-03-22',
    summary: 'Assessment of recent drug policy changes in Illinois and their measurable effect on incarceration and court caseloads.',
    categories: ['Drug Policy']
  }
]

// ─── Runtime ─────────────────────────────────────────────────────────────────
const router = useRouter()
const { fetchPageBySlug } = usePages()
const { loadIndex, getByType } = useSearch()

const page = ref(null)
const isLoading = ref(true)


// Merge Strapi page data over mock defaults — mock fills any missing field
const currentPage = computed(() => ({ ...MOCK, ...(page.value || {}) }))

// Real articles from search index (top 6); fall back to mock when index empty
const latestArticles = computed(() => getByType('article').slice(0, 6))
const displayArticles = computed(() => latestArticles.value.length ? latestArticles.value : MOCK_ARTICLES)

const goToArticle = (slug) => router.push(`/articles/${slug}`)

onMounted(async () => {
  isLoading.value = true
  try {
    const [pageData] = await Promise.all([
      fetchPageBySlug(PAGE_SLUG),
      loadIndex()
    ])
    page.value = pageData
  } catch {
    // Silently fall back to mock data — Strapi page may not exist yet
  } finally {
    isLoading.value = false
  }
})
</script>
