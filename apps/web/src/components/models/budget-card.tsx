import { Wallet } from 'lucide-react';
import { getModelCardShellClass, type ModelCardProps } from './types';

export function BudgetCard({ className = '' }: ModelCardProps) {
  return (
    <a href="/models/personal-finance/budget" className={`block group ${className}`}>
      <div className={getModelCardShellClass('emerald')}>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2.5 dark:bg-emerald-900/50">
            <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="fa-model-title text-xl">Budget Optimizer</h3>
        </div>
        <p className="fa-model-description mb-4 text-sm">
          Analyze spending patterns with 50/30/20 rule, calculate financial health score, optimize
          budget allocations, and track debt-to-income ratio.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="fa-model-card-chip bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            50/30/20 Rule
          </span>
          <span className="fa-model-card-chip bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            Health Score
          </span>
          <span className="fa-model-card-chip bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
            Optimization
          </span>
        </div>
        <div className="fa-model-card-cta text-emerald-600 group-hover:text-emerald-700 dark:text-emerald-400 dark:group-hover:text-emerald-300">
          Try it →
        </div>
      </div>
    </a>
  );
}
