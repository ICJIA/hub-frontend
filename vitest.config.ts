import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 60000,
    reporters: ['verbose'],
    passWithNoTests: true,
    printConsoleTrace: false
  }
})
