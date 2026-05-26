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
                    :to="`/programs/${project.slug}`"
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

// ─── All programs for the sidebar nav ────────────────────────────────────────
// TODO: replace with Strapi fetch when wired up
const allPrograms = [
  { slug: 'justice-counts', title: 'Justice Counts Implementation Program' },
  { slug: 'restore-reinvest-renew', title: 'Restore, Reinvest, Renew (R3)' },
  { slug: 'deaths-in-custody', title: 'Deaths in Custody' },
  { slug: 'infonet', title: 'InfoNet' },
  { slug: 'illinois-uniform-crime-report', title: 'Illinois Uniform Crime Report' },
  { slug: 'violence-prevention-research', title: 'Violence Prevention Research' },
]

// ─── Per-slug static content ─────────────────────────────────────────────────
// TODO: replace with Strapi fetch(route.params.slug) when wired up
const PROGRAMS = {
  'justice-counts': {
    slug: 'justice-counts',
    icon: 'i-lucide-landmark',
    title: 'Justice Counts Implementation Program',
    tagline: 'Information flows are both technically sound and policy-relevant.',
    body: [
      'ICJIA leads Illinois\'s participation in Justice Counts, a national initiative to standardize and publish criminal justice metrics across agencies. The project improves transparency and decision-making by collecting core data from law enforcement, courts, corrections, and behavioral health systems. ICJIA serves as the state\'s technical lead, helping agencies align with national benchmarks and build sustainable reporting infrastructure.',
      'Justice Counts represents a transformative shift in how Illinois—and the nation—approaches criminal justice data. By participating in this national initiative, ICJIA\'s Research & Analysis Unit is helping build a framework where key metrics like arrests, jail populations, court case flow, and behavioral health referrals are consistently defined and publicly reported. This not only enhances transparency but also empowers local agencies to benchmark their performance, identify gaps, and make informed decisions grounded in real-time data. ICJIA\'s role includes coordinating across jurisdictions, refining data definitions, and ensuring that the infrastructure built for Justice Counts is scalable, sustainable, and policy-relevant. Through this work, R&A is positioning Illinois as a leader in justice system accountability and data modernization.',
    ],
    projectManager: 'Jack Monaghan',
    publications: [
      { title: 'Illinois Prisons - Population by Facility', date: 'Sept. 23, 2025', url: '#' },
      { title: 'Illinois Prisons - Population by County', date: 'Sept. 23, 2025', url: '#' },
      { title: 'Law Enforcement - Clearance Rate', date: 'Dec. 10, 2025', url: '#' },
      { title: 'Law Enforcement - NIBRS Summary', date: 'Dec. 10, 2025', url: '#' },
    ],
    resources: [
      {
        title: 'ILLINOIS CRIMINAL JUSTICE INFORMATION AUTHORITY FISCAL YEAR 2025 ANNUAL REPORT',
        description: 'Public Act 103-283 amended the Criminal Code to establish the offense of "lewd sexual display in a penal institution"',
        pdfUrl: '#',
      },
      {
        title: 'Lewd Sexual Display in a Penal Institution: State Fiscal Year 2025 Report',
        description: 'Public Act 103-283 amended the Criminal Code to establish the offense of "lewd sexual display in a penal institution"',
        pdfUrl: '#',
      },
      {
        title: 'Process Evaluation of a Rural, Police-Initiated Deflection Program in Southern Illinois: Leadership Team Feedback',
        description: 'Public Act 103-283 amended the Criminal Code to establish the offense of "lewd sexual display in a penal institution"',
        pdfUrl: '#',
      },
    ],
  },
  'restore-reinvest-renew': {
    slug: 'restore-reinvest-renew',
    icon: 'i-lucide-refresh-cw',
    title: 'Restore, Reinvest, Renew (R3)',
    tagline: 'Investing in communities most impacted by violence and incarceration.',
    body: [
      'The Restore, Reinvest, Renew (R3) program was created through the Cannabis Regulation and Tax Act to invest in communities most impacted by economic disinvestment, violence, and the historical over-enforcement of cannabis laws.',
      'ICJIA administers R3 funding by supporting local organizations delivering services in eligible communities across Illinois. Program areas include civil legal aid, economic development, reentry, violence prevention, and youth development.',
    ],
    projectManager: 'Program Staff',
    publications: [
      { title: 'R3 Program Year 1 Evaluation Report', date: 'Jan. 15, 2025', url: '#' },
      { title: 'R3 Grantee Outcomes Summary', date: 'Mar. 4, 2025', url: '#' },
    ],
    resources: [
      {
        title: 'R3 Program Overview and Eligibility Guide',
        description: 'A comprehensive overview of R3 funding eligibility, program areas, and application requirements.',
        pdfUrl: '#',
      },
      {
        title: 'R3 Year 2 Grantee Report',
        description: 'Summary of outcomes and community impact from Year 2 R3 grant recipients across Illinois.',
        pdfUrl: '#',
      },
    ],
  },
  'deaths-in-custody': {
    slug: 'deaths-in-custody',
    icon: 'i-lucide-file-text',
    title: 'Deaths in Custody',
    tagline: 'Tracking and reporting deaths that occur in law enforcement custody across Illinois.',
    body: [
      'ICJIA collects and reports data on deaths that occur in law enforcement custody in Illinois, fulfilling state and federal reporting requirements. This data is critical for understanding the circumstances surrounding in-custody deaths and informing policy.',
      'The Deaths in Custody reporting program captures incidents from local jails, state prisons, and during law enforcement encounters. ICJIA works with agencies statewide to ensure accurate and timely submission of data to both state and federal repositories.',
    ],
    projectManager: 'Program Staff',
    publications: [
      { title: 'Deaths in Custody Annual Report 2024', date: 'Feb. 20, 2025', url: '#' },
      { title: 'In-Custody Death Data Summary', date: 'Aug. 11, 2025', url: '#' },
    ],
    resources: [
      {
        title: 'Deaths in Custody: 2024 Annual Report',
        description: 'Annual summary of deaths occurring in law enforcement custody across Illinois for calendar year 2024.',
        pdfUrl: '#',
      },
    ],
  },
  'infonet': {
    slug: 'infonet',
    icon: 'i-lucide-database',
    title: 'InfoNet',
    tagline: 'A statewide data system for victim service providers in Illinois.',
    body: [
      'InfoNet is a web-based data collection and reporting system used by more than 100 victim service providers in Illinois. The system is one of only a few known central repositories in the country for statewide, standardized victim service data.',
      'ICJIA manages and maintains the InfoNet system, providing training and technical assistance to participating organizations. The data collected through InfoNet informs state and federal reporting, program planning, and resource allocation decisions.',
    ],
    projectManager: 'Program Staff',
    publications: [
      { title: 'InfoNet Annual Summary Report', date: 'Apr. 30, 2025', url: '#' },
      { title: 'Victim Services Data Trends in Illinois', date: 'Oct. 2, 2025', url: '#' },
    ],
    resources: [
      {
        title: 'InfoNet User Guide',
        description: 'Step-by-step documentation for victim service providers using the InfoNet data entry and reporting system.',
        pdfUrl: '#',
      },
      {
        title: 'InfoNet Data Dictionary',
        description: 'Definitions and coding guidelines for all variables collected through the InfoNet system.',
        pdfUrl: '#',
      },
    ],
  },
  'illinois-uniform-crime-report': {
    slug: 'illinois-uniform-crime-report',
    icon: 'i-lucide-shield',
    title: 'Illinois Uniform Crime Report',
    tagline: 'Annual statewide crime statistics collected from law enforcement agencies across Illinois.',
    body: [
      'The Illinois Uniform Crime Report (UCR) is ICJIA\'s annual compilation of crime statistics reported by law enforcement agencies throughout the state. The report captures data on offenses, arrests, clearances, and law enforcement personnel, providing a comprehensive picture of crime trends in Illinois.',
      'ICJIA collects, validates, and publishes UCR data in partnership with the Illinois State Police. The program supports evidence-based decision-making by giving policymakers, researchers, and the public access to consistent, comparable crime data across jurisdictions. ICJIA also provides trend analysis and data visualizations to help stakeholders interpret the data in context.',
    ],
    projectManager: 'Program Staff',
    publications: [
      { title: 'Illinois UCR Annual Report 2024', date: 'June 10, 2025', url: '#' },
      { title: 'Crime in Illinois: 2023 Summary', date: 'Mar. 5, 2025', url: '#' },
      { title: 'Law Enforcement Agency Reporting Rates', date: 'Jan. 22, 2025', url: '#' },
    ],
    resources: [
      {
        title: 'Illinois UCR 2024 Annual Report',
        description: 'Comprehensive statewide crime statistics for 2024, including offense counts, arrest data, and clearance rates by agency.',
        pdfUrl: '#',
      },
      {
        title: 'UCR Data Dictionary and Methodology',
        description: 'Definitions, reporting standards, and methodology used to compile the Illinois Uniform Crime Report.',
        pdfUrl: '#',
      },
      {
        title: 'Crime Trends in Illinois: Five-Year Analysis',
        description: 'Longitudinal analysis of crime trends across major offense categories from 2019–2024.',
        pdfUrl: '#',
      },
    ],
  },
  'violence-prevention-research': {
    slug: 'violence-prevention-research',
    icon: 'i-lucide-heart-handshake',
    title: 'Violence Prevention Research',
    tagline: 'Evidence-based research informing Illinois\'s response to violence and community harm.',
    body: [
      'ICJIA\'s Violence Prevention Research program reviews scientific literature, designs and conducts studies, and collects and analyzes data on violent crime in Illinois. The program helps inform and enhance the state\'s criminal justice response to violence through timely research publications, presentations, and collaborative discussions with stakeholders.',
      'Center staff examine environmental, social, and individual factors that contribute to the occurrence of violent crime. They seek collaboration with a diverse set of stakeholders to understand the scope of existing prevention and intervention efforts and guide future strategies. This includes evaluating community violence intervention programs, assessing the effectiveness of gun violence reduction strategies, and producing research that translates findings into actionable policy recommendations for Illinois communities.',
    ],
    projectManager: 'Program Staff',
    publications: [
      { title: 'Gun Violence in Illinois: 2024 Annual Review', date: 'Aug. 15, 2025', url: '#' },
      { title: 'Community Violence Intervention Program Evaluation', date: 'May 3, 2025', url: '#' },
      { title: 'Homicide Trends: A Statewide Analysis', date: 'Feb. 28, 2025', url: '#' },
    ],
    resources: [
      {
        title: 'Violence Prevention Program Evaluation Report',
        description: 'Evaluation of community-based violence intervention programs funded across Illinois, assessing outcomes and effectiveness.',
        pdfUrl: '#',
      },
      {
        title: 'Gun Violence in Illinois: 2024 Annual Report',
        description: 'Comprehensive analysis of gun-related incidents, homicides, and injury data across Illinois counties for 2024.',
        pdfUrl: '#',
      },
      {
        title: 'Community Violence Intervention: Best Practice Guide',
        description: 'A practitioner-focused guide summarizing evidence-based approaches to community violence intervention.',
        pdfUrl: '#',
      },
    ],
  },
}

// ─── Active program data (falls back to a 404-style empty state) ─────────────
const program = computed(() => PROGRAMS[currentSlug.value] ?? {
  icon: 'i-lucide-folder',
  title: 'Program Not Found',
  tagline: '',
  body: ['This program page could not be found.'],
  projectManager: null,
  publications: [],
  resources: [],
})

// ─── Publications "load more" ─────────────────────────────────────────────────
const visibleCount = ref(4)
const visiblePublications = computed(() => program.value.publications.slice(0, visibleCount.value))

// Reset count when navigating between programs
watch(currentSlug, () => { visibleCount.value = 4 })
</script>
