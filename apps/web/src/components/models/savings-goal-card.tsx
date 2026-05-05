import { Target } from 'lucide-react';
import type { ModelCardProps } from './types';

export function SavingsGoalCard({ className = '' }: ModelCardProps) {
  return (
    <a
      href="/models/personal-finance/savings-goal"
      className={`block group ${className}`}
    >
      <div className="h-full rounded-lg border border-teal-200 bg-linear-to-br from-teal-50 to-white p-6 shadow-sm transition-all hover:border-teal-400 hover:shadow-md dark:border-teal-800 dark:from-teal-950/50 dark:to-gray-900 dark:hover:border-teal-600">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-teal-100 p-2.5 dark:bg-teal-900/50">
            <Target className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <h3 className="fa-model-title text-xl">
            Savings Goal Planner
          </h3>
        </div>
        <p className="fa-model-description mb-4 text-sm">
          Plan and track progress toward financial goals with compound interest
          calculations, inflation adjustments, and alternative scenarios.
        </p>
        <div className="flex flex-wrap gap-2">
           <span className="fa-model-card-chip bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
             Goal Timeline
           </span>
           <span className="fa-model-card-chip bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
             Compound Interest
           </span>
           <span className="fa-model-card-chip bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
             Inflation Adjusted
           </span>
         </div>
         <div className="fa-model-card-cta text-teal-600 group-hover:text-teal-700 dark:text-teal-400 dark:group-hover:text-teal-300">
           Try it →
         </div>
      </div>
    </a>
  );
}
