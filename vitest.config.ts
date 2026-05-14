import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
// Force UTC so date formatting tests are timezone-independent
process.env.TZ = 'UTC'

// Replace Nuxt-specific import.meta.* globals so composables can run without
// the full Nuxt build pipeline.
const nuxtMetaPlugin = {
  name: 'nuxt-meta-replace',
  transform(code: string, id: string) {
    if (!id.includes('node_modules') && (code.includes('import.meta.client') || code.includes('import.meta.server'))) {
      return code
        .replace(/import\.meta\.client/g, 'true')
        .replace(/import\.meta\.server/g, 'false')
    }
  },
}

export default defineConfig({
  plugins: [nuxtMetaPlugin, vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/a11y/**', 'node_modules/**'],
    testTimeout: 30000,
    reporters: ['verbose'],
    passWithNoTests: false,
    env: {
      VITE_API_BASE_URL: 'http://localhost:1338',
      VITE_PREVIEW_SECRET: 'test-preview-secret',
    },
    coverage: {
      provider: 'v8',
      include: [
        'app/utils/**',
        'app/composables/**',
        'app/components/**',
        'app/middleware/**',
      ],
      exclude: [
        'app/**/*.d.ts',
        'node_modules/**',
        // RichTextEditor wraps Quill — requires real browser + Quill runtime,
        // not meaningfully testable as a pure unit test.
        'app/components/RichTextEditor.vue',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      reporter: ['text', 'lcov', 'html'],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
      '@': resolve(__dirname, './app'),
    },
  },
})
