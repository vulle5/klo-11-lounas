/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      ...require('./tsconfig.json').compilerOptions.paths,
    },
  },
  test: {
    setupFiles: './vitest.setup.ts',
  },
});
