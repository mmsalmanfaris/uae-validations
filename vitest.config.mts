import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'lcov', 'json-summary'],
      // Property tests use a random seed, so coverage moves by up to ~0.5% between runs.
      // Keep each floor about that far below the lowest observed value; raise them as tests are added.
      thresholds: {
        statements: 95,
        branches: 90.5,
        functions: 100,
        lines: 96.3,
      },
    },
  },
});
