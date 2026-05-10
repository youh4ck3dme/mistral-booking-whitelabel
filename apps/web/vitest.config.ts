import path from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@repo/ai': path.resolve(__dirname, '../../packages/@repo/ai/src'),
      '@repo/core': path.resolve(__dirname, '../../packages/@repo/core/src'),
      '@repo/supabase': path.resolve(__dirname, '../../packages/@repo/supabase/src'),
      '@repo/ui': path.resolve(__dirname, '../../packages/@repo/ui/src'),
      '@repo/web': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
