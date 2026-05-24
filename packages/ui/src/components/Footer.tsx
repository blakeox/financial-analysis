import React, { useEffect, useState } from 'react';
import { copyClasses } from '../lib/classNames';
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
        'border-t border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,250,255,0.98))] dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(5,8,22,0.98),rgba(9,14,36,0.98))]',
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
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">
                Fanalyx
              </h2>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-7 text-slate-600 dark:text-slate-300">
              AI-powered financial analysis for clearer questions, clearer formulas, and clearer
              decisions.
            </p>
          </div>

          <div>
            <h3
              className={cn('text-sm font-semibold uppercase tracking-[0.16em]', copyClasses.muted)}
            >
              Product
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <a
                  href="/"
                  className="transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/models"
                  className="transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Models
                </a>
              </li>
              <li>
                <a
                  href="/agent"
                  className="transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Agent
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  className="transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3
              className={cn('text-sm font-semibold uppercase tracking-[0.16em]', copyClasses.muted)}
            >
              Resources
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <a
                  href="/developers"
                  className="transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Developers
                </a>
              </li>
              <li>
                <a
                  href="/blog"
                  className="transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="/status"
                  className="transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Status
                </a>
              </li>
              <li>
                <a
                  href="/disclaimer"
                  className="transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Disclaimer
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3
              className={cn('text-sm font-semibold uppercase tracking-[0.16em]', copyClasses.muted)}
            >
              Legal
            </h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li>
                <a
                  href="/privacy"
                  className="transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@fanalyx.com"
                  className="transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-200/80 pt-8 dark:border-slate-800">
          <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 xl:text-center">
            &copy; {currentYear} Fanalyx. Educational decision support only. Not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
};
