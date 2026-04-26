import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const [hydrated, setHydrated] = useState(false);

  // Handle client-side hydration safety
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Don't render until hydrated to prevent SSR/client mismatch
  if (!hydrated) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr]">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-violet-700 text-lg font-extrabold tracking-[-0.06em] text-white shadow-[0_14px_30px_rgba(109,74,255,0.24)]">
                F
              </span>
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-gray-900 dark:text-white">
                Fanalyx
              </h2>
            </div>
            <p className="mt-5 text-sm leading-7 text-gray-600 dark:text-gray-400">
              AI-powered financial analysis for clearer questions, clearer formulas, and clearer
              decisions.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Product
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="/" className="hover:text-gray-900 dark:hover:text-white">
                  Home
                </a>
              </li>
              <li>
                <a href="/models" className="hover:text-gray-900 dark:hover:text-white">
                  Models
                </a>
              </li>
              <li>
                <a href="/agent" className="hover:text-gray-900 dark:hover:text-white">
                  Agent
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-gray-900 dark:hover:text-white">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Resources
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="/developers" className="hover:text-gray-900 dark:hover:text-white">
                  Developers
                </a>
              </li>
              <li>
                <a href="/blog" className="hover:text-gray-900 dark:hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="/status" className="hover:text-gray-900 dark:hover:text-white">
                  Status
                </a>
              </li>
              <li>
                <a href="/disclaimer" className="hover:text-gray-900 dark:hover:text-white">
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
              Legal
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="/privacy" className="hover:text-gray-900 dark:hover:text-white">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-gray-900 dark:hover:text-white">
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@fanalyx.com"
                  className="hover:text-gray-900 dark:hover:text-white"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
          <p className="text-sm leading-7 text-gray-600 dark:text-gray-400 xl:text-center">
            &copy; {currentYear} Fanalyx. Educational decision support only. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
};
