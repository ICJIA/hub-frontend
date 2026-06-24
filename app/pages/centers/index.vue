<template>
  <div>
    <!-- ══════════════════════════════════════════════════
         1. HERO — dark navy, full-width
    ═══════════════════════════════════════════════════ -->
    <div class="text-white bg-[#1a3a5c] min-h-[200px]">
      <div class="max-w-[1400px] mx-auto px-6 py-12 flex items-center">
        <div class="flex-1">
          <h1 class="text-4xl font-bold mb-3 leading-tight">Centers</h1>
          <p class="text-white text-base max-w-2xl leading-relaxed">
            The ICJIA's Research &amp; Analysis Unit operates specialized centers that provide data-driven insights and
            program evaluations to guide evidence-based policy, funding decisions, and legislative reform across
            Illinois's justice system.
          </p>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════
         2. ABOUT — icon + title + body paragraphs
    ═══════════════════════════════════════════════════ -->
    <div class="bg-gray-50 dark:bg-gray-900 py-10">
      <div class="max-w-[1400px] mx-auto px-6">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-9 h-9 rounded-lg bg-[#1a3a5c] flex items-center justify-center shrink-0">
            <UIcon name="i-lucide-building-2" class="w-5 h-5 text-white" />
          </div>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Centers in Research &amp; Analysis</h2>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 ml-12">Quality criminal justice research and analytics</p>

        <div class="space-y-4 text-gray-700 dark:text-gray-300 text-base leading-relaxed max-w-4xl">
          <p>
            The Research &amp; Analysis Unit serves as Illinois' Statistical Analysis Center (SAC). State SACs provide
            objective analysis of criminal justice data for informing statewide policy and practice. The Illinois SAC is
            affiliated with and supported by the Justice Information Resource Network (JIRN), a national nonprofit
            organization that promotes collaboration and exchange of information among state SACs, and acts as a liaison
            between state agencies and the U.S. Department of Justice.
          </p>
          <p>
            R&amp;A has taken a leadership role in convening policymakers and practitioners to coordinate and improve
            system response to crime and to promote the use of evidence-based and promising practices at the state and
            local level. The unit staffs statutorily created criminal justice initiatives. It also develops statistical
            methodologies and provides statistical advice and interpretation to support criminal justice
            decision-making and information needs.
          </p>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════
         3. SPECIALIZED CENTERS GRID
    ═══════════════════════════════════════════════════ -->
    <div class="bg-white dark:bg-gray-950 py-12">
      <div class="max-w-[1400px] mx-auto px-6">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Our Specialized Centers</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-8">
          We analyze data to better inform the community of Criminal Justice activities.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="center in centers"
            :key="center.id"
            class="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col"
          >
            <!-- Image with overlay label -->
            <div class="relative h-44 bg-gray-300 dark:bg-gray-700 shrink-0">
              <img
                v-if="center.imageUrl"
                :src="center.imageUrl"
                :alt="center.name"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full"
                :style="{ background: center.placeholderBg }"
              />
              <!-- Name + manager overlay at bottom of image -->
              <div class="absolute bottom-0 left-0 right-0 bg-[#1a3a5c]/80 px-3 py-2">
                <span class="text-white text-sm font-semibold leading-snug block">{{ center.name }}</span>
                <span class="text-white/80 text-xs">{{ center.manager }}</span>
              </div>
            </div>

            <!-- Card body -->
            <div class="p-4 flex flex-col flex-1">
              <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 mb-4">
                {{ center.description }}
              </p>
              <div class="flex justify-center mt-auto">
                <UButton
                  variant="outline"
                  color="gray"
                  size="sm"
                  class="w-28"
                  @click="openModal(center)"
                >
                  View
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Center detail modal -->
    <UModal v-model:open="modalOpen" :title="selectedCenter?.name" :description="selectedCenter?.manager">
      <template #body>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {{ selectedCenter?.description }}
        </p>
      </template>
    </UModal>
  </div>
</template>

<script setup>
defineRouteRules({ prerender: true })

const selectedCenter = ref(null)
const modalOpen = computed({
  get: () => selectedCenter.value !== null,
  set: (val) => { if (!val) selectedCenter.value = null },
})

function openModal(center) {
  selectedCenter.value = center
}

const centers = [
  {
    id: 1,
    name: 'Center for Community Corrections Research',
    manager: 'Vacant',
    description:
      'The Center for Community Corrections Research conducts research and evaluation projects on interventions designed to divert individuals from prison; and, to improve re-entry for persons returning to their communities after incarceration. The goal is to expand the use of effective community interventions using evaluation, research, and implementation science. Center staff collect and analyze a variety of data including administrative, qualitative and quantitative. Research and evaluation reports are designed to influence Illinois policies regarding the use of interventions such as problem-solving courts, probation, behavioral and medical treatments; and, to evaluate the effectiveness of these interventions to reduce prison recidivism in diverse populations. The Center develops data visualizations and dashboards to assist with program management and improvements. Center staff publish research and evaluation reports, work in collaboration with external evaluators, and provide research presentations.',
    imageUrl: null,
    placeholderBg: 'linear-gradient(135deg, #2d4a6e 0%, #1a3a5c 100%)',
  },
  {
    id: 2,
    name: 'Center for Criminal Justice Data and Analytics',
    manager: 'Vacant',
    description:
      'The Center for Criminal Justice Data and Analytics continually collects, analyzes, reports on, and disseminates crime and risk factor statistical information for strategic planning, policy decisions and public education. Staff has developed a repository of these data on the ICJIA website, along with various online tools for data display and analysis. In partnership with the State Police, the Center is responsible for the dissemination of state criminal history record information (CHRI) data for research purposes, including in-house analytic use. The Center provides technical assistance in statistical methods, database design, data analysis and presentation.',
    imageUrl: null,
    placeholderBg: 'linear-gradient(135deg, #3a5a7e 0%, #1a3a5c 100%)',
  },
  {
    id: 3,
    name: 'Center for Justice Research and Evaluation',
    manager: 'Jessica Reichert, Manager',
    description:
      'The Center for Justice Research and Evaluation conducts applied research and evaluation projects that examine critical criminal and juvenile justice topics and criminal justice program implementation and outcomes in Illinois. Staff collect data through multiple research methods, conduct advanced statistical analyses, and summarize findings in publications that aim to inform policy and practice. The center also conducts presentations and offers technical assistance to help state and local programs and initiatives use data to inform and improve their work.',
    imageUrl: null,
    placeholderBg: 'linear-gradient(135deg, #4a6a8e 0%, #1a3a5c 100%)',
  },
  {
    id: 4,
    name: 'Center for Sponsored Research & Program Development',
    manager: 'Tracy Hahn, Manager',
    description:
      'The Center for Sponsored Research & Program Development secures experts in the field to conduct research and evaluate programs that inform policy, support evidence-based practices, and guide decision-making. Staff review and select programs and other priority criminal justice-related topics viable for evaluation and further research. Researchers are selected through a competitive process and are awarded federal grant subcontracts to conduct studies. The center also provides technical assistance to programs supported with Authority-administered grant funds as they refine program objectives, develop data collection tools, and assess program performance.',
    imageUrl: null,
    placeholderBg: 'linear-gradient(135deg, #2d4a6e 0%, #1a3a5c 100%)',
  },
  {
    id: 5,
    name: 'Center for Victim Studies',
    manager: 'Amanda L. Vasquez, Manager',
    description:
      'The Center for Victim Studies designs and conducts research examining the nature and scope of victimization in Illinois and evaluates programs that address victim needs. Center staff use a variety of research methods and analyses to explore victimization and victim services in order to improve policy, programming, and practice throughout the state. The center also coordinates presentations and disseminates reports, translating promising research into implications for policy and practice for stakeholders and victim service providers. Staff also provide technical assistance to help victim service programs collect data to inform how to best meet the multifaceted needs of victims. Finally, staff manage the InfoNet System, a web-based data collection and reporting system used by more than 100 victim service providers in Illinois. The system is one of only a few known central repositories in the country for statewide, standardized victim service data.',
    imageUrl: null,
    placeholderBg: 'linear-gradient(135deg, #3a5a7e 0%, #1a3a5c 100%)',
  },
  {
    id: 6,
    name: 'Center for Violence Prevention and Intervention Research',
    manager: 'Thomas Johnson, Manager',
    description:
      'The Center for Violence Prevention and Intervention Research reviews scientific literature, designs and conducts studies, and collects and analyzes data on violent crime in Illinois to help inform and enhance the state\'s criminal justice response to violence through timely research publications, presentations and discussions. Center staff examine environmental, social, and individual factors that contribute to the occurrence of violent crime and seek collaboration with a diverse set of stakeholders to understand the scope of existing prevention and intervention efforts and guide future strategies more broadly.',
    imageUrl: null,
    placeholderBg: 'linear-gradient(135deg, #4a6a8e 0%, #1a3a5c 100%)',
  },
]

useSeoMeta({
  title: 'Centers | ICJIA Research Hub',
  description:
    "The ICJIA's Research & Analysis Unit operates specialized centers that provide data-driven insights and program evaluations.",
  ogTitle: 'Centers | ICJIA Research Hub',
  ogDescription:
    "The ICJIA's Research & Analysis Unit operates specialized centers that provide data-driven insights and program evaluations.",
})
</script>
