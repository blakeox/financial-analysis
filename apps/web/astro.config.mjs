import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://fanalyx.com',
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/debug') &&
        !page.includes('/models-old') &&
        !page.includes('/models-clean') &&
        !page.includes('/test-') &&
        !page.includes('/_') &&
        !page.endsWith('/sitemap') && // Exclude HTML sitemap (we have XML sitemap)
        !page.includes('/ai-field-demo') &&
        !page.includes('/analytics') &&
        !page.includes('/dashboard') &&
        !page.includes('/my-financial-dashboard'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Custom priority and changefreq based on page importance
      serialize(item) {
        let isHomepage = false;
        try {
          const parsed = new URL(item.url);
          isHomepage =
            parsed.hostname === 'fanalyx.com' &&
            (parsed.pathname === '/' || parsed.pathname === '');
        } catch {
          isHomepage = false;
        }

        // Homepage - highest priority
        if (isHomepage) {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        // Main category pages
        else if (
          item.url.includes('/models') ||
          item.url.includes('/journey') ||
          item.url.includes('/developers')
        ) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        // Calculator pages
        else if (
          item.url.includes('/calculator/') ||
          item.url.includes('/lease-analysis') ||
          item.url.includes('/ebitda-forecasting') ||
          item.url.includes('/commercial-real-estate')
        ) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        }
        // Journey and step pages
        else if (item.url.includes('/journey/') || item.url.includes('/step/')) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        }
        // Other pages (privacy, terms, status, etc.)
        else {
          item.priority = 0.5;
          item.changefreq = 'monthly';
        }
        return item;
      },
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
    plugins: [tailwindcss()],
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
