import { Wallet } from 'lucide-react';
import type { ModelCardProps } from './types';

export function BudgetCard({ className = '' }: ModelCardProps) {
  return (
    <a
      href="/models/personal-finance/budget"
      className={`block group ${className}`}
    >
      <div className="h-full rounded-lg border border-emerald-200 bg-linear-to-br from-emerald-50 to-white p-6 shadow-sm transition-all hover:border-emerald-400 hover:shadow-md dark:border-emerald-800 dark:from-emerald-950/50 dark:to-gray-900 dark:hover:border-emerald-600">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-900/50">
            <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Budget Optimizer
          </h3>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Analyze spending patterns with 50/30/20 rule, calculate financial
          health score, optimize budget allocations, and track debt-to-income
          ratio.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            50/30/20 Rule
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            Health Score
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            Optimization
          </span>
        </div>
        <div className="mt-4 flex items-center text-sm font-medium text-emerald-600 group-hover:text-emerald-700 dark:text-emerald-400 dark:group-hover:text-emerald-300">
          Try it →
        </div>
      </div>
    </a>
  );
}
