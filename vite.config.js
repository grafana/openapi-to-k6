import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      reporter: ['json', 'text', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*'],
      exclude: ['/node_modules/', '/src/logger.ts'],
    },
  },
})
