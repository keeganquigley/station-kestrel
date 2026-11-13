import { defineConfig } from 'vite';

// Relative base so the built game runs from any folder (GitHub Pages included).
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 900 },
  test: { include: ['tests/**/*.test.js'] },
});
