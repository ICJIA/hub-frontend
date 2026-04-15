import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  nitro: {
    hooks: {
      async compiled(nitro: any) {
        const { writeFileSync, mkdirSync, existsSync } = await import('node:fs')
        const { join } = await import('node:path')

        const API_BASE_URL = process.env.VITE_API_BASE_URL || ''
        const BEARER_TOKEN = process.env.VITE_API_BEARER_TOKEN || ''
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(BEARER_TOKEN && { Authorization: `Bearer ${BEARER_TOKEN}` })
        }

        function stripMarkdown(text: string): string {
          if (!text) return ''
          return text
            .replace(/#{1,6}\s+/g, '')
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/__(.+?)__/g, '$1')
            .replace(/_(.+?)_/g, '$1')
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/`{1,3}[^`]*`{1,3}/g, '')
            .replace(/^>\s+/gm, '')
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/^\s*\d+\.\s+/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim()
        }

        async function fetchAllItems(endpoint: string): Promise<any[]> {
          const items: any[] = []
          let page = 1
          while (true) {
            const params = new URLSearchParams({
              populate: '*',
              'pagination[page]': String(page),
              'pagination[pageSize]': '100',
              sort: 'date:desc'
            })
            const res = await fetch(`${API_BASE_URL}/api/${endpoint}?${params}`, { headers })
            if (!res.ok) throw new Error(`[${endpoint}] HTTP ${res.status}`)
            const json = await res.json()
            items.push(...(json.data || []))
            const p = json.meta?.pagination
            if (!p || page >= p.pageCount) break
            page++
          }
          return items
        }

        try {
          console.log('\n⚙  Building search index...')
          const [articles, apps, datasets] = await Promise.all([
            fetchAllItems('articles'),
            fetchAllItems('apps'),
            fetchAllItems('datasets')
          ])

          const resolveUrl = (url: string) => {
            if (!url) return ''
            return url.startsWith('/') ? `${API_BASE_URL}${url}` : url
          }

          const index = [
            ...articles.map((a: any) => ({
              id: a.id,
              type: 'article',
              slug: a.slug ?? '',
              title: a.title ?? '',
              summary: a.abstract ?? '',
              content: stripMarkdown(a.markdown ?? '').slice(0, 3000),
              categories: Array.isArray(a.categories) ? a.categories.filter(Boolean) : [],
              authors: Array.isArray(a.authors)
                ? a.authors.map((x: any) => (typeof x === 'string' ? x : (x?.title || x?.name || x?.Name || '')).trim()).filter(Boolean)
                : [],
              date: a.date ?? '',
              imageUrl: resolveUrl(a.splash?.url ?? '')
            })),
            ...apps.map((a: any) => ({
              id: a.id,
              type: 'app',
              slug: a.slug ?? '',
              title: a.title ?? '',
              summary: a.description ?? '',
              content: '',
              categories: Array.isArray(a.categories) ? a.categories.filter(Boolean) : [],
              authors: Array.isArray(a.contributors)
                ? a.contributors.map((x: any) => (typeof x === 'string' ? x : (x?.name || x?.Name || '')).trim()).filter(Boolean)
                : [],
              date: a.date ?? '',
              imageUrl: resolveUrl(Array.isArray(a.image) ? (a.image[0]?.url ?? '') : (a.image?.url ?? ''))
            })),
            ...datasets.map((d: any) => ({
              id: d.id,
              type: 'dataset',
              slug: d.slug ?? '',
              title: d.title ?? '',
              summary: d.description ?? '',
              content: '',
              categories: Array.isArray(d.categories) ? d.categories.filter(Boolean) : [],
              authors: [],
              date: d.date ?? '',
              imageUrl: ''
            }))
          ]

          const outputDir = nitro.options.output.publicDir
          if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true })
          writeFileSync(join(outputDir, 'search-index.json'), JSON.stringify(index))

          // Also write to public/ so `nuxt dev` serves it after a build
          const publicDir = join(nitro.options.rootDir, 'public')
          if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true })
          writeFileSync(join(publicDir, 'search-index.json'), JSON.stringify(index))

          console.log(`✓ Search index: ${index.length} items (${articles.length} articles · ${apps.length} apps · ${datasets.length} datasets)\n`)
        } catch (err) {
          console.error('✗ Failed to build search index:', err)
        }
      }
    }
  },


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
