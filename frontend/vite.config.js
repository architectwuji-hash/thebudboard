import { defineConfig } from 'vite';

/** Static build for Cloudflare Pages (output matches dashboard: .next). */
export default defineConfig({
  base: '/',
  build: {
    outDir: '.next',
    emptyOutDir: true,
    rollupOptions: {
      external: [/^three(\/.*)?$/],
    },
  },
});
