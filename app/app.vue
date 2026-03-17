<script setup>
const title = 'ICJIA Research Hub v2.0'
const siteUrl = 'https://v2hub.netlify.app'
const author = 'Illinois Criminal Justice Information Authority'
const description = 'Access ICJIA research articles, datasets, and interactive applications from Illinois\' Statistical Analysis Center.'
const publishedDate = '2026-03-17'
const modifiedDate = new Date().toISOString().split('T')[0]

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'author', content: author }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'canonical', href: siteUrl }
  ],
  htmlAttrs: {
    lang: 'en'
  },
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': title,
        'url': siteUrl,
        'description': description,
        'publisher': {
          '@type': 'Organization',
          'name': author,
          'url': 'https://icjia.illinois.gov'
        },
        'datePublished': publishedDate,
        'dateModified': modifiedDate,
        'inLanguage': 'en'
      })
    }
  ]
})

useSeoMeta({
  title,
  description,
  author,
  ogTitle: title,
  ogDescription: description,
  ogUrl: siteUrl,
  ogImage: `${siteUrl}/og-image.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogType: 'website',
  ogSiteName: 'ICJIA Research Hub',
  articlePublishedTime: publishedDate,
  articleModifiedTime: modifiedDate,
  twitterImage: `${siteUrl}/og-image.png`,
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description
})
</script>

<template>
  <UApp>
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-white"
    >
      Skip to main content
    </a>

    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          aria-label="ICJIA Research Hub home"
        >
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>

        <TemplateMenu />
      </template>

      <template #right>
        <UColorModeButton />

        <UButton
          to="https://github.com/ICJIA/hub-frontend"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub repository"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>

    <UMain id="main-content">
      <NuxtPage />
    </UMain>

    <USeparator
      aria-hidden="true"
      icon="i-simple-icons-nuxtdotjs"
    />

    <UFooter>
      <template #left>
        <p class="text-sm text-(--ui-text-muted)">
          Built with Nuxt UI &bull; &copy; {{ new Date().getFullYear() }} Illinois Criminal Justice Information Authority
        </p>
      </template>

      <template #right>
        <UButton
          to="https://github.com/ICJIA/hub-frontend"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub repository"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>
