export default defineNuxtConfig({
  modules: ['@nuxt/ui','@nuxt/eslint'],
  ssr: false,

  colorMode: {
    preference: 'light',
    fallback: 'light'
  },

  css: ['~/assets/style.css'],

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
      }
    }
  }
})
