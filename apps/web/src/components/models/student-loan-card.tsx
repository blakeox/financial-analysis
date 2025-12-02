import { GraduationCap } from 'lucide-react';
import type { ModelCardProps } from './types';

export function StudentLoanCard({ className = '' }: ModelCardProps) {
  return (
    <a
      href="/models/personal-finance/student-loan"
      className={`block group ${className}`}
    >
      <div className="h-full rounded-lg border border-indigo-200 bg-linear-to-br from-indigo-50 to-white p-6 shadow-sm transition-all hover:border-indigo-400 hover:shadow-md dark:border-indigo-800 dark:from-indigo-950/50 dark:to-gray-900 dark:hover:border-indigo-600">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-indigo-100 p-2.5 dark:bg-indigo-900/50">
            <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Student Loan Analyzer
          </h3>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Optimize student loan repayment with avalanche/snowball strategies,
          income-driven repayment plans (IBR, PAYE, REPAYE), and refinancing
          analysis.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            Payoff Strategies
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            IDR Plans
          </span>
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            Refinancing
          </span>
        </div>
        <div className="mt-4 flex items-center text-sm font-medium text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-400 dark:group-hover:text-indigo-300">
          Try it →
        </div>
      </div>
    </a>
  );
}
