import { defineConfig } from 'vite';

/** Static build for Cloudflare Pages (output: dist). */
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
