import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint', '@nuxt/a11y'],
  colorMode: {
    preference: 'system',
    fallback: 'light'
  },

  css: ['~/assets/style.css'],

  app: {
    head: {
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
    serverBundle: {
      collections: ['heroicons','lucide'] // add any other collections you use
    }
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
    '/': { prerender: true }
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
