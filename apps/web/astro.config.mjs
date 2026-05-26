import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://fanalyx.com',
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        let pathname = page;
        try {
          pathname = new URL(page).pathname;
        } catch {
          return false;
        }
        return (
          !pathname.startsWith('/debug') &&
          !pathname.startsWith('/models-old') &&
          !pathname.startsWith('/models-clean') &&
          !pathname.startsWith('/test-') &&
          !pathname.includes('/_') &&
          pathname !== '/sitemap' &&
          !pathname.startsWith('/ai-field-demo') &&
          !pathname.startsWith('/analytics') &&
          !pathname.startsWith('/dashboard') &&
          !pathname.startsWith('/my-financial-dashboard')
        );
      },
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // Custom priority and changefreq based on page importance
      serialize(item) {
        let pathname = '/';
        let isHomepage = false;
        try {
          const parsed = new URL(item.url);
          pathname = parsed.pathname;
          isHomepage = parsed.hostname === 'fanalyx.com' && (pathname === '/' || pathname === '');
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
          pathname === '/models' ||
          pathname.startsWith('/models/') ||
          pathname === '/journey' ||
          pathname.startsWith('/journey/') ||
          pathname === '/developers' ||
          pathname.startsWith('/developers/')
        ) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        // Calculator pages
        else if (
          pathname.startsWith('/calculator/') ||
          pathname === '/lease-analysis' ||
          pathname.startsWith('/ebitda-forecasting') ||
          pathname.startsWith('/commercial-real-estate')
        ) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        }
        // Journey and step pages
        else if (pathname.startsWith('/journey/') || pathname.startsWith('/step/')) {
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
