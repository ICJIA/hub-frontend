<script setup>
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

const title = 'ICJIA Research Hub v2.0'
const siteUrl = 'https://v2hub.netlify.app'
const description = 'Access ICJIA research articles, datasets, and interactive applications from Illinois\' Statistical Analysis Center.'

useHead({
  link: [
    { rel: 'canonical', href: siteUrl }
  ]
})

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogUrl: siteUrl,
  ogImage: `${siteUrl}/og-image.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogType: 'website',
  ogSiteName: 'ICJIA Research Hub',
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
