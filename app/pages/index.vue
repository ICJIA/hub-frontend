<template>
  <div>
    <!-- ══════════════════════════════════════════════════
         1. HERO — dark navy, full-width
    ═══════════════════════════════════════════════════ -->
    <div
      class="text-white bg-cover bg-top bg-no-repeat min-h-[355px]"
      style="background-image: url('https://v2.hub.icjia-api.cloud/uploads/hero_research_hub_9802a98e5f.png');"
    >
      <div class="max-w-[1400px] mx-auto px-6 py-12 flex items-center justify-between gap-8">
        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-3 leading-tight">{{ currentPage.title }}</h1>
          <p class="text-white text-base max-w-2xl leading-relaxed">{{ currentPage.subtitle }}</p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex flex-col items-center py-20 bg-white dark:bg-gray-950">
      <UIcon name="i-heroicons-arrow-path" class="w-10 h-10 animate-spin text-primary-500" />
      <p class="mt-4 text-gray-500">Loading page...</p>
    </div>

    <template v-else>

      <UAlert
        v-if="pageError"
        color="warning"
        icon="i-lucide-triangle-alert"
        title="Could not load page content from Strapi"
        :description="pageError.message"
        class="mx-4 mt-4"
      />

      <!-- ══════════════════════════════════════════════════
           2. RAU INFO BOX — white section, blue card
      ═══════════════════════════════════════════════════ -->
      <div class="bg-white dark:bg-gray-900 py-8">
        <div class="max-w-[1400px] mx-auto px-4">
          <div class="bg-white dark:bg-gray-900 p-6">
            <div class="flex gap-4">
              <UIcon name="i-lucide-landmark" class="w-8 h-8 shrink-0 text-gray-700 dark:text-gray-300 mt-1" />
              <div>
                <h2 class="text-xl font-bold mb-2 dark:text-white">{{ currentPage.unitName }}</h2>
                <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{{ currentPage.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════
           3. KEY STATISTICS — white section, navy cards
      ═══════════════════════════════════════════════════ -->
      <div class="bg-[#1a3a5c] dark:bg-gray-900 py-8">
        <div class="max-w-[1400px] mx-auto px-4">
          <h2 class="text-xl font-bold mb-4 text-white">{{ currentPage.statisticsTitle }}</h2>
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="stat in currentPage.statistics"
              :key="stat.label"
              class="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-[10px] border-white dark:border-gray-700 flex flex-col"
            >
              <div class="px-5 py-4" :class="stat.headerBg || 'bg-[#1a3a5c]'">
                <span class="text-4xl font-extrabold text-white">{{ stat.value }}</span>
              </div>
              <div class="px-5 py-4 flex flex-col flex-1">
                <h3 class="font-bold text-gray-900 dark:text-white mb-2 leading-snug">{{ stat.label }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">{{ stat.description }}</p>
                <a v-if="stat.url" :href="stat.url" class="mt-3 text-sm text-blue-700 dark:text-blue-400 hover:underline font-medium">Read More</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════
           4. CENTERS — light gray section, accordion list
      ═══════════════════════════════════════════════════ -->
      <div class="bg-gray-50 dark:bg-gray-900 py-8">
        <div class="max-w-[1400px] mx-auto px-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-lg bg-[#1a3a5c] flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-building-2" class="w-5 h-5 text-white" />
            </div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ currentPage.centersTitle }}</h2>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">{{ currentPage.centersSubtitle }}</p>
          <div class="max-w-2xl divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div
              v-for="center in currentPage.centers"
              :key="center.name"
            >
              <div
                class="flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                role="button"
                tabindex="0"
                :aria-expanded="!!center._open"
                @click="center._open = !center._open"
                @keydown.enter.prevent="center._open = !center._open"
                @keydown.space.prevent="center._open = !center._open"
              >
                <span class="font-medium text-sm dark:text-white">{{ center.name }}</span>
                <UIcon
                  :name="center._open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="w-4 h-4 text-gray-400"
                />
              </div>
              <div
                v-if="center._open"
                class="px-5 py-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700"
              >
                <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{{ center.description }}</p>
                <a v-if="center.url" :href="center.url" class="text-sm text-blue-700 dark:text-blue-400 hover:underline font-medium">View center's products →</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════
           5. LATEST ARTICLES — white section, 3-col grid
      ═══════════════════════════════════════════════════ -->
      <div class="bg-white dark:bg-gray-900 py-10">
        <div class="max-w-[1400px] mx-auto px-4">
          <h2 class="text-xl font-bold mb-6 dark:text-white">{{ currentPage.articlesTitle }}</h2>
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
            <UButton :to="currentPage.articlesButtonUrl" variant="outline" size="md">{{ currentPage.articlesButtonLabel }}</UButton>
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
              <h2 class="text-xl font-bold mb-2 dark:text-white">{{ currentPage.topicsTitle }}</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">{{ currentPage.topicsSubtitle }}</p>
              <ul class="bg-white dark:bg-gray-800 rounded-lg p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                <li
                  v-for="topic in currentPage.topics"
                  :key="topic.label"
                >
                  <NuxtLink
                    :to="`/articles?topic=${encodeURIComponent(topic.label)}`"
                    class="flex items-center gap-2 group"
                  >
                    <UIcon name="i-lucide-check" class="w-4 h-4 text-blue-900 dark:text-blue-400 shrink-0" />
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
                  src="https://v2.hub.icjia-api.cloud/uploads/topics_hero_1_2455dbc45d.png"
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
          <h2 class="text-xl font-bold mb-6 dark:text-white">{{ currentPage.resourcesTitle }}</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              v-for="resource in currentPage.resources"
              :key="resource.title"
              class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-4"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center"
                  :class="resource.iconBg"
                >
                  <UIcon :name="resource.icon" class="w-6 h-6" :class="resource.iconColor" />
                </div>
                <div>
                  <p class="font-bold text-gray-900 dark:text-white text-sm leading-snug">{{ resource.title }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ resource.subtitle }}</p>
                </div>
              </div>
              <UButton :to="resource.url" variant="outline" color="gray" block size="sm" class="border border-gray-200 dark:border-gray-600">{{ currentPage.resourceViewLabel }}</UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════
           8. MAJOR PROJECTS — carousel
      ═══════════════════════════════════════════════════ -->
      <div class="bg-gray-50 dark:bg-gray-900 py-10">
        <div class="max-w-[1400px] mx-auto px-4">
          <!-- Header -->
          <div class="flex items-center gap-3 mb-2">
            <div class="w-9 h-9 rounded-lg bg-[#1a3a5c] flex items-center justify-center shrink-0">
              <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-white" />
            </div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ currentPage.projectsTitle }}</h2>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">{{ currentPage.projectsSubtitle }}</p>

          <!-- Carousel -->
          <UCarousel
            ref="projectsCarouselRef"
            :items="currentPage.projects"
            arrows
            :options="{ duration: 25 }"
            :ui="{
              item: 'basis-[420px]',
              container: 'gap-5',
            }"
          >
            <template #prev="{ onClick }">
              <UButton
                v-if="!carouselAtStart"
                icon="i-lucide-chevron-left"
                color="white"
                variant="solid"
                size="md"
                class="rounded-full shadow"
                @click="onClick"
              />
            </template>
            <template #next="{ onClick }">
              <UButton
                icon="i-lucide-chevron-right"
                color="white"
                variant="solid"
                size="md"
                class="rounded-full shadow"
                @click="onClick"
              />
            </template>
            <template #default="{ item: project }">
              <div class="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
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
                  <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{{ project.description }}</p>
                  <ul class="space-y-2 flex-1 mb-5">
                    <li v-for="bullet in project.bullets" :key="bullet" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <UIcon name="i-lucide-check-circle-2" class="w-4 h-4 text-green-600 shrink-0" />
                      <span>{{ bullet }}</span>
                    </li>
                  </ul>
                  <div class="flex justify-end">
                    <UButton :to="project.url || currentPage.projectLearnMoreUrl" variant="outline" color="gray" size="sm" class="border border-gray-200 dark:border-gray-600">{{ currentPage.projectLearnMoreLabel }}</UButton>
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
defineRouteRules({ prerender: true })

import { ref, reactive, computed, watch } from 'vue'
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
  articlesTitle: 'Latest Articles',
  articlesButtonLabel: 'View All Articles',
  articlesButtonUrl: '/articles',
  topicsSubtitle: 'Browse research by topic area. Each topic links to filtered articles and resources from the Research and Analysis Unit.',
  resourceViewLabel: 'View',
  projectLearnMoreLabel: 'Learn More',
  projectLearnMoreUrl: '#',
  statisticsTitle: 'Key Statistics',
  statistics: [
    {
      value: '470',
      label: 'Uses Of Force in 2025',
      description: 'This number reflects the safe-T acts count of Use of Force. Which only include incidents in which a person was hospitalized or killed as a result of use of force.',
      url: '#',
      headerBg: 'bg-[#1d6fb8]'
    },
    {
      value: '28,000',
      label: 'Persons Arrested in 2025',
      description: 'This number reflects the safe-T acts count of Use of Force. Which only include incidents in which a person was hospitalized or killed as a result of use of force.',
      url: '#',
      headerBg: 'bg-[#4a9fd4]'
    },
    {
      value: '173,042',
      label: 'Reported Offences in 2025',
      description: 'This number reflects the safe-T acts count of Use of Force. Which only include incidents in which a person was hospitalized or killed as a result of use of force.',
      url: '#',
      headerBg: 'bg-[#1a3a5c]'
    }
  ],
  centersTitle: 'Centers in the Research and Analysis Unit',
  centersSubtitle: 'There are five centers in R&A that focus on different areas of the criminal justice system. Click the tiles to the left to get an overview of the centers and their research.',
  centers: [
    {
      name: 'Center for Community Corrections Research',
      description: 'The Center for Community Corrections Research conducts research and evaluation projects on interventions designed to divert individuals from prison; and, to improve re-entry for persons returning to their communities after incarceration. The goal is to expand the use of effective community interventions using evaluation, research, and implementation science. Center staff collect and analyze a variety of data including administrative, qualitative and quantitative. Research and evaluation reports are designed to influence Illinois policies regarding the use of interventions such as problem-solving courts, probation, behavioral and medical treatments; and, to evaluate the effectiveness of these interventions to reduce prison recidivism in diverse populations. The Center develops data visualizations and dashboards to assist with program management and improvements. Center staff publish research and evaluation reports, work in collaboration with external evaluators, and provide research presentations.',
      url: '#'
    },
    {
      name: 'Center for Criminal Justice Data and Analytics',
      description: 'The Center for Criminal Justice Data and Analytics continually collects, analyzes, reports on, and disseminates crime and risk factor statistical information for strategic planning, policy decisions and public education. Staff has developed a repository of these data on the ICJIA website, along with various online tools for data display and analysis. In partnership with the State Police, the Center is responsible for the dissemination of state criminal history record information (CHRI) data for research purposes, including in-house analytic use. The Center provides technical assistance in statistical methods, database design, data analysis and presentation.',
      url: '#'
    },
    {
      name: 'Center for Sponsored Research & Program Development',
      description: 'The Center for Sponsored Research & Program Development secures experts in the field to conduct research and evaluate programs that inform policy, support evidence-based practices, and guide decision-making. Staff review and select programs and other priority criminal justice-related topics viable for evaluation and further research. Researchers are selected through a competitive process and are awarded federal grant subcontracts to conduct studies. The center also provides technical assistance to programs supported with Authority-administered grant funds as they refine program objectives, develop data collection tools, and assess program performance.',
      url: '#'
    },
    {
      name: 'Center for Victim Studies',
      description: 'The Center for Victim Studies designs and conducts research examining the nature and scope of victimization in Illinois and evaluates programs that address victim needs. Center staff use a variety of research methods and analyses to explore victimization and victim services in order to improve policy, programming, and practice throughout the state. The center also coordinates presentations and disseminates reports, translating promising research into implications for policy and practice for stakeholders and victim service providers. Staff also provide technical assistance to help victim service programs collect data to inform how to best meet the multifaceted needs of victims. Finally, staff manage the InfoNet System, a web-based data collection and reporting system used by more than 100 victim service providers in Illinois. The system is one of only a few known central repositories in the country for statewide, standardized victim service data. Click here to learn more about InfoNet.',
      url: '#'
    },
    {
      name: 'Center for Violence Prevention and Intervention Research',
      description: 'The Center for Violence Prevention and Intervention Research reviews scientific literature, designs and conducts studies, and collects and analyzes data on violent crime in Illinois to help inform and enhance the state’s criminal justice response to violence through timely research publications, presentations and discussions. Center staff examine environmental, social, and individual factors that contribute to the occurrence of violent crime and seek collaboration with a diverse set of stakeholders to understand the scope of existing prevention and intervention efforts and guide future strategies more broadly.',
      url: '#'
    }
  ].map(c => reactive({ ...c, _open: false })),
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

const { data: page, pending: isLoading, error: pageError } = await useAsyncData(
  'home-page',
  () => fetchPageBySlug(PAGE_SLUG)
)

useSeoMeta({
  title: 'ICJIA Research Hub',
  description: 'Illinois Criminal Justice Information Authority — Research and Analysis Unit. Criminal justice research, data, and policy resources for Illinois.',
  ogTitle: 'ICJIA Research Hub',
  ogDescription: 'Illinois Criminal Justice Information Authority — Research and Analysis Unit. Criminal justice research, data, and policy resources for Illinois.',
  ogImage: 'https://v2.hub.icjia-api.cloud/uploads/hero_research_hub_9802a98e5f.png',
  twitterCard: 'summary_large_image',
})

useAsyncData('search-index', () => loadIndex(), { server: false })

// Merge Strapi page data over mock defaults — mock fills any missing field
const currentPage = computed(() => {
  try {
    const merged = { ...MOCK, ...(page.value || {}) }
    // The blind spread can overwrite MOCK arrays with raw Strapi data that may
    // contain null/undefined items. Sanitize all known array fields up front.
    for (const key of ['projects', 'resources', 'topics', 'centers', 'statistics']) {
      if (Array.isArray(merged[key])) merged[key] = merged[key].filter(Boolean)
    }
    if (page.value?.statistics?.length) {
      merged.statistics = page.value.statistics.filter(Boolean).map((stat, i) => ({
        value: stat.count,
        label: stat.title,
        description: stat.body,
        url: stat.url,
        headerBg: MOCK.statistics[i]?.headerBg ?? 'bg-[#1a3a5c]'
      }))
    }
    if (page.value?.centers?.length) {
      merged.centers = page.value.centers.filter(Boolean).map(c => reactive({ ...c, _open: false }))
    }
    if (page.value?.hero?.length) {
      const hero = page.value.hero[0]
      if (hero?.title) merged.title = hero.title
      if (hero?.subtitle) merged.subtitle = hero.subtitle
    }
    if (page.value?.infobox?.length) {
      const infobox = page.value.infobox[0]
      if (infobox?.unitName) merged.unitName = infobox.unitName
      if (infobox?.description) merged.description = infobox.description
    }
    if (page.value?.resources?.length) {
      merged.resources = page.value.resources.filter(Boolean)
    }
    const componentFields = [
      'articlesTitle', 'articlesButtonLabel', 'articlesButtonUrl',
      'topicsSubtitle', 'resourceViewLabel', 'projectLearnMoreLabel', 'projectLearnMoreUrl', 'statisticsTitle'
    ]
    for (const field of componentFields) {
      const raw = page.value?.[field]
      if (Array.isArray(raw) && raw[0]?.[field]) merged[field] = raw[0][field]
    }
    return merged
  } catch (e) {
    console.error('[currentPage]', e)
    return MOCK
  }
})

// Real articles from search index (top 6); fall back to mock when index empty
const latestArticles = computed(() => getByType('article').slice(0, 6))
const displayArticles = computed(() => latestArticles.value.length ? latestArticles.value : MOCK_ARTICLES)

const goToArticle = (slug) => router.push(`/articles/${slug}`)

const projectsCarouselRef = ref(null)
const carouselAtStart = ref(true)

watch(projectsCarouselRef, (carousel) => {
  if (!carousel) return
  const embla = carousel.emblaApi
  if (!embla) return
  carouselAtStart.value = !embla.canScrollPrev()
  embla.on('select', () => {
    carouselAtStart.value = !embla.canScrollPrev()
  })
}, { flush: 'post' })

</script>
