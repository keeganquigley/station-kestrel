import { defineConfig } from 'vite';

// The dev server injects CSS as inline <style> tags, which the Content Security Policy in
// index.html blocks. Allow them while developing only; the built game links a stylesheet.
const devInlineStyles = {
  name: 'dev-inline-styles',
  apply: 'serve',
  transformIndexHtml: (html) => html.replace("default-src 'self';", "default-src 'self'; style-src 'self' 'unsafe-inline';"),
};

// Relative base so the built game runs from any folder (GitHub Pages included).
export default defineConfig({
  base: './',
  plugins: [devInlineStyles],
  build: { chunkSizeWarningLimit: 900 },
  test: { include: ['tests/**/*.test.js'] },
});
