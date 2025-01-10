import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['json', 'text', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*'],
      exclude: ['/node_modules/', '/src/logger.ts'],
    },
  },
})
