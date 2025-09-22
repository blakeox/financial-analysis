import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react()],
  output: 'static', // Static site for Cloudflare Pages
  // No adapter needed for static output
  vite: {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    // Prevent watcher from triggering on build output
    server: {
      watch: {
        ignored: ['**/dist/**', '**/.astro/**'],
      },
    },
  },
});
