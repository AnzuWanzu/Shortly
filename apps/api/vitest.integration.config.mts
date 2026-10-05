import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/api-integration',
  test: {
    name: 'api-integration',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.integration.spec.ts'],
    fileParallelism: false,
    testTimeout: 10_000,
    reporters: ['default'],
  },
}));
