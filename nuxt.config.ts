import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  nitro: {
    hooks: {
      async compiled(nitro: any) {
        const { writeFileSync, mkdirSync, existsSync } = await import('node:fs')
        const { join } = await import('node:path')
        const { buildIndex } = await import('./scripts/lib/build-search-index.mjs')

        const apiBaseUrl = process.env.VITE_API_BASE_URL || ''
        const bearerToken = process.env.API_BEARER_TOKEN || ''

        console.log('\n⚙  Building search index...')
        const { index, counts } = await buildIndex({ apiBaseUrl, bearerToken })

        const outputDir = nitro.options.output.publicDir
        if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })
        writeFileSync(join(outputDir, 'search-index.json'), JSON.stringify(index))

        // Also write to public/ so `nuxt dev` serves it after a build
        const publicDir = join(nitro.options.rootDir, 'public')
        if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })
        writeFileSync(join(publicDir, 'search-index.json'), JSON.stringify(index))

        console.log(`✓ Search index: ${index.length} items (${counts.articles} articles · ${counts.apps} apps · ${counts.datasets} datasets)\n`)
      }
    }
  },


  runtimeConfig: {
    apiToken: process.env.API_BEARER_TOKEN || '',
    strapiUrl: process.env.VITE_API_BASE_URL || 'http://localhost:1338',
    public: {}
  },

  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxt/a11y'],
  colorMode: {
    preference: 'system',
    fallback: 'light'
  },

  css: ['~/assets/style.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'robots', content: 'index, follow' },
        { property: 'og:site_name', content: 'ICJIA Research Hub' },
        { property: 'og:type', content: 'website' },
      ],
      script: [
        {
          // crypto.randomUUID() is only available in secure contexts (HTTPS/localhost).
          // @nuxt/a11y requires it; this polyfill covers non-secure dev origins (IP access).
          innerHTML: `if(typeof crypto!=='undefined'&&!crypto.randomUUID){crypto.randomUUID=function(){return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return(c==='x'?r:(r&0x3|0x8)).toString(16)})};}`
        }
      ]
    }
  },
  icon: {
    clientBundle: {
      scan: true, // auto-detect icons used in your project
      sizeLimitKb: 256
    },
    provider: 'iconify' // use Iconify CDN as fallback
  },

  devtools: {
    enabled: true
  },

  devServer: {
    port: 3000,
    host: '0.0.0.0'
  },

  vite: {
    server: {
      headers: {
        'Content-Security-Policy': 'frame-ancestors *'
      }
    },
    optimizeDeps: {
      exclude: ['reka-ui']
    },
    resolve: {
      dedupe: ['vue', '@vue/runtime-core', '@vue/runtime-dom']
    }
  },
  compatibilityDate: '2025-01-15',

  routeRules: {
    '/**': {
      headers: {
        'Content-Security-Policy': 'frame-ancestors *'
      },
    },
    '/': { prerender: true },
    '/preview/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/appspreview/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/datasetpreview/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/previewreadonly/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/appspreviewreadonly/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/datasetpreviewreadonly/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
