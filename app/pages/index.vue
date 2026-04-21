<template>
  <div>
    <!-- ═══════════════════════════════════════════════════
         Hero Banner
    ════════════════════════════════════════════════════ -->
    <div class="bg-[#1a3a5c] text-white">
      <div class="max-w-[1400px] mx-auto px-6 py-12 flex items-center justify-between gap-8">
        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-3 leading-tight">{{ currentPage.title }}</h1>
          <p class="text-white/75 text-base max-w-2xl leading-relaxed">{{ currentPage.subtitle }}</p>
        </div>
        <UIcon name="i-lucide-gavel" class="w-28 h-28 text-white/15 shrink-0 hidden md:block" />
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         Loading / Error (shown inside the page area)
    ════════════════════════════════════════════════════ -->
    <div v-if="isLoading" class="flex flex-col items-center py-20">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
      <p class="mt-4 text-gray-500">Loading page...</p>
    </div>

    <UAlert
      v-else-if="loadError"
      color="warning"
      icon="i-lucide-triangle-alert"
      :description="loadError"
      class="m-6"
    />

    <div v-else class="max-w-[1400px] mx-auto px-4 py-8 space-y-12">

      <!-- ─────────────────────────────────────────────
           RAU Info Box
      ────────────────────────────────────────────── -->
      <section class="bg-blue-700 text-white rounded-lg p-6">
        <div class="flex gap-4">
          <UIcon name="i-lucide-landmark" class="w-8 h-8 shrink-0 text-white/60 mt-1" />
          <div>
            <h2 class="text-xl font-bold mb-2">{{ currentPage.unitName }}</h2>
            <p class="text-white/85 leading-relaxed text-sm">{{ currentPage.description }}</p>
          </div>
        </div>
      </section>

      <!-- ─────────────────────────────────────────────
           Key Statistics
      ────────────────────────────────────────────── -->
      <section>
        <h2 class="text-xl font-bold mb-4">Key Statistics</h2>
        <div class="grid grid-cols-3 gap-4">
          <div
            v-for="stat in currentPage.statistics"
            :key="stat.label"
            class="bg-[#1a3a5c] text-white rounded-lg p-6 text-center"
          >
            <div class="text-4xl font-extrabold mb-1">{{ stat.value }}</div>
            <div class="text-sm text-white/65 uppercase tracking-wide">{{ stat.label }}</div>
          </div>
        </div>
      </section>

      <!-- ─────────────────────────────────────────────
           Persons accordion
      ────────────────────────────────────────────── -->
      <section>
        <h2 class="text-xl font-bold mb-4">{{ currentPage.personsTitle }}</h2>
        <div class="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div
            v-for="person in currentPage.persons"
            :key="person.name"
          >
            <div
              class="flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              @click="person._open = !person._open"
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
      </section>

      <!-- ─────────────────────────────────────────────
           Latest Articles
      ────────────────────────────────────────────── -->
      <section>
        <h2 class="text-xl font-bold mb-4">Latest Articles</h2>
        <div v-if="latestArticles.length" class="grid grid-cols-12 gap-4 mb-6">
          <div
            v-for="article in latestArticles"
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
        <!-- Mock article cards shown when search index is empty -->
        <div v-else class="grid grid-cols-12 gap-4 mb-6">
          <div
            v-for="article in mockArticles"
            :key="article.slug"
            class="col-span-12 sm:col-span-6 md:col-span-4"
          >
            <ContentCard
              :title="article.title"
              :date="article.date"
              :description="article.summary"
              :categories="article.categories"
              :image-url="null"
              view-mode="grid"
              @click="goToArticle(article.slug)"
            />
          </div>
        </div>
        <div class="flex justify-center">
          <UButton to="/articles" variant="outline" size="md">View All Articles</UButton>
        </div>
      </section>

      <!-- ─────────────────────────────────────────────
           Topics + sidebar
      ────────────────────────────────────────────── -->
      <section class="grid grid-cols-12 gap-6">
        <!-- Topics -->
        <div class="col-span-12 lg:col-span-7">
          <h2 class="text-xl font-bold mb-2">{{ currentPage.topicsTitle }}</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Browse research by topic area. Each topic links to filtered articles and resources from the Research and Analysis Unit.
          </p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="topic in currentPage.topics"
              :key="topic.label"
              :color="topic.color"
              size="lg"
              class="cursor-pointer capitalize"
              @click="goToArticlesByTopic(topic.label)"
            >
              {{ topic.label }}
            </UBadge>
          </div>
        </div>
        <!-- Sidebar card -->
        <div class="col-span-12 lg:col-span-5">
          <div class="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden h-full min-h-[200px]">
            <img
              src="https://icjia.illinois.gov/researchhub/img/icjia-hero.jpg"
              alt="ICJIA Research"
              class="w-full h-full object-cover"
              @error="(e) => e.target.style.display = 'none'"
            />
          </div>
        </div>
      </section>

      <!-- ─────────────────────────────────────────────
           Latest Resources
      ────────────────────────────────────────────── -->
      <section>
        <h2 class="text-xl font-bold mb-4">{{ currentPage.resourcesTitle }}</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a
            v-for="resource in currentPage.resources"
            :key="resource.title"
            :href="resource.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex flex-col items-center gap-3 p-5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
          >
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center"
              :class="resource.iconBg"
            >
              <UIcon :name="resource.icon" class="w-5 h-5 text-white" />
            </div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ resource.title }}</span>
          </a>
        </div>
      </section>

      <!-- ─────────────────────────────────────────────
           Major Projects
      ────────────────────────────────────────────── -->
      <section>
        <h2 class="text-xl font-bold mb-4">{{ currentPage.projectsTitle }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="project in currentPage.projects"
            :key="project.title"
            class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col"
          >
            <div class="h-44 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
              <img
                v-if="project.imageUrl"
                :src="project.imageUrl"
                :alt="project.title"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
                :class="project.placeholderBg || 'bg-[#1a3a5c]'"
              >
                <UIcon :name="project.icon || 'i-lucide-folder'" class="w-12 h-12 text-white/30" />
              </div>
            </div>
            <div class="p-4 flex flex-col flex-1">
              <h3 class="font-semibold text-base mb-2 leading-snug">{{ project.title }}</h3>
              <ul v-if="project.bullets?.length" class="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-3 flex-1">
                <li v-for="bullet in project.bullets" :key="bullet" class="flex items-start gap-2">
                  <UIcon name="i-lucide-chevron-right" class="w-3.5 h-3.5 mt-0.5 text-primary-500 shrink-0" />
                  <span>{{ bullet }}</span>
                </li>
              </ul>
              <p v-else-if="project.description" class="text-sm text-gray-500 dark:text-gray-400 mb-3 flex-1">
                {{ project.description }}
              </p>
              <UButton
                v-if="project.url"
                :to="project.url"
                variant="ghost"
                size="xs"
                icon="i-lucide-arrow-right"
                trailing
              >
                Learn more
              </UButton>
            </div>
          </div>
        </div>
      </section>

    </div>
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
    { value: '8',   label: 'Members' },
    { value: '41+', label: 'Published Reports' },
    { value: '9+',  label: 'Research Topics' }
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
      bio: 'Amanda Klump conducts quantitative and qualitative research on juvenile justice, reentry, and community-based programming. She holds a Master\'s degree in criminology and has contributed to multiple statewide program evaluations.'
    },
    {
      name: 'Janelle Vasquez',
      title: 'Policy Analyst',
      bio: 'Janelle Vasquez translates research findings into actionable policy recommendations for state and local agencies. Her background spans legislative analysis, stakeholder engagement, and grant program oversight across multiple justice domains.'
    },
    {
      name: 'Jessica Reichert',
      title: 'Senior Research Director',
      bio: 'Jessica Reichert leads the unit\'s portfolio of federally funded research projects. With two decades of experience, she has directed major studies on homicide, domestic violence, human trafficking, and substance use disorder treatment outcomes.'
    },
    {
      name: 'Malgorzata Davis',
      title: 'Senior Research Analyst',
      bio: 'Malgorzata Davis focuses on violence prevention, gun violence, and homicide research. She brings expertise in geospatial analysis and statistical modeling to support data-informed decision-making by law enforcement and community organizations.'
    },
    {
      name: 'Rebeccah Strandberg',
      title: 'Research Analyst',
      bio: 'Rebeccah Strandberg supports the unit\'s work on mental health diversion, victimization, and restorative justice. She has a background in social work and applies mixed-methods research approaches to complex criminal justice questions.'
    },
    {
      name: 'Samantha DiPietro',
      title: 'Research Analyst',
      bio: 'Samantha DiPietro conducts research on drug policy, incarceration trends, and reentry outcomes. She collaborates with partner agencies to develop data dashboards and visualizations that make research findings accessible to practitioners and policymakers.'
    }
  ].map(p => reactive({ ...p, _open: false })),
  topicsTitle: 'Topics in R&A',
  topics: [
    { label: 'Homicide',            color: 'error' },
    { label: 'Gun Violence',        color: 'error' },
    { label: 'Drug Policy',         color: 'warning' },
    { label: 'Human Trafficking',   color: 'warning' },
    { label: 'Mental Health',       color: 'success' },
    { label: 'Juvenile Justice',    color: 'info' },
    { label: 'Reentry',             color: 'info' },
    { label: 'Victimization',       color: 'neutral' },
    { label: 'Crime Analysis',      color: 'neutral' }
  ],
  resourcesTitle: 'Latest Resources',
  resources: [
    { title: 'Annual Report',    icon: 'i-lucide-file-text',    iconBg: 'bg-red-500',    url: '#' },
    { title: 'Data Dashboard',   icon: 'i-lucide-bar-chart-2',  iconBg: 'bg-green-600',  url: '#' },
    { title: 'Research Briefs',  icon: 'i-lucide-file-search',  iconBg: 'bg-blue-600',   url: '#' },
    { title: 'Datasets',         icon: 'i-lucide-database',     iconBg: 'bg-orange-500', url: '#' }
  ],
  projectsTitle: 'Major Projects in R&A',
  projects: [
    {
      title: 'Homicide / Missing Persons Program',
      placeholderBg: 'bg-slate-700',
      icon: 'i-lucide-search',
      bullets: [
        'Cold-case homicide review',
        'Missing persons data linkage',
        'Statewide investigative support'
      ],
      url: '#'
    },
    {
      title: 'Illinois Uniform Crime Report',
      placeholderBg: 'bg-blue-900',
      icon: 'i-lucide-shield',
      bullets: [
        'Annual statewide crime statistics',
        'Law enforcement agency reporting',
        'Trend analysis & visualization'
      ],
      url: '#'
    },
    {
      title: 'Violence Prevention Research',
      placeholderBg: 'bg-teal-800',
      icon: 'i-lucide-heart-handshake',
      bullets: [
        'Evidence-based program evaluation',
        'Community violence intervention',
        'Policy recommendations'
      ],
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
const loadError = ref(null)

// Merge Strapi page data over mock defaults — mock fills any missing field
const currentPage = computed(() => ({ ...MOCK, ...(page.value || {}) }))

const mockArticles = MOCK_ARTICLES

// Real articles from search index (top 6); fall back to mock when index empty
const latestArticles = computed(() => getByType('article').slice(0, 6))

const goToArticle = (slug) => router.push(`/articles/${slug}`)
const goToArticlesByTopic = (label) => router.push(`/articles?topic=${encodeURIComponent(label)}`)

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
