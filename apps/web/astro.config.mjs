import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://fanalyx.com',
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/debug') &&
        !page.includes('/models-old') &&
        !page.includes('/models-clean'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      customPages: [
        'https://fanalyx.com/',
        'https://fanalyx.com/models',
        'https://fanalyx.com/models/personal',
        'https://fanalyx.com/models/business',
      ],
    }),
  ],
  output: 'static', // Static site for Cloudflare Pages
  // No adapter needed for static output
  redirects: {
    // Redirect old calculator URLs to new modular calculator URLs
    '/amortization': '/calculator/amortization',
    '/auto-loan': '/calculator/auto-loan',
    '/retirement': '/calculator/retirement',
    '/savings-goal': '/calculator/savings-goal',
    '/debt-payoff': '/calculator/debt-payoff',
    '/student-loans': '/calculator/student-loans',
    '/budget': '/calculator/budget',
  },
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
