import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react()],
  output: 'static', // Changed from 'server' for development
  // adapter: undefined, // Will be configured for Cloudflare Pages later
  vite: {
    resolve: {
      alias: {
        '@': '/src',
        '@ui': '../../../packages/ui/src',
      },
    },
  },
});
