import { PiggyBank } from 'lucide-react';
import type { ModelCardProps } from './types';

export function RetirementCard({ className = '' }: ModelCardProps) {
  return (
    <a
      href="/models/personal-finance/retirement"
      className={`block group ${className}`}
    >
      <div className="h-full rounded-lg border border-purple-200 bg-linear-to-br from-purple-50 to-white p-6 shadow-sm transition-all hover:border-purple-400 hover:shadow-md dark:border-purple-800 dark:from-purple-950/50 dark:to-gray-900 dark:hover:border-purple-600">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2.5 dark:bg-purple-900/50">
            <PiggyBank className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Retirement Calculator
          </h3>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Project retirement savings across multiple accounts (401k, IRA, Roth)
          with employer match optimization, tax advantages, and withdrawal
          strategies.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
            Multi-Account
          </span>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
            Employer Match
          </span>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
            Tax Analysis
          </span>
        </div>
        <div className="mt-4 flex items-center text-sm font-medium text-purple-600 group-hover:text-purple-700 dark:text-purple-400 dark:group-hover:text-purple-300">
          Try it →
        </div>
      </div>
    </a>
  );
}
