import { PiggyBank } from 'lucide-react';
import { getModelCardShellClass, type ModelCardProps } from './types';

export function RetirementCard({ className = '' }: ModelCardProps) {
  return (
    <a
      href="/models/personal-finance/retirement"
      className={`block group ${className}`}
    >
      <div className={getModelCardShellClass('violet')}>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-violet-100 p-2.5 dark:bg-violet-900/50">
            <PiggyBank className="h-6 w-6 text-violet-600 dark:text-violet-300" />
          </div>
          <h3 className="fa-model-title text-xl">
            Retirement Calculator
          </h3>
        </div>
        <p className="fa-model-description mb-4 text-sm">
          Project retirement savings across multiple accounts (401k, IRA, Roth)
          with employer match optimization, tax advantages, and withdrawal
          strategies.
        </p>
        <div className="flex flex-wrap gap-2">
           <span className="fa-model-card-chip bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
             Multi-Account
            </span>
           <span className="fa-model-card-chip bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
             Employer Match
            </span>
           <span className="fa-model-card-chip bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
             Tax Analysis
            </span>
          </div>
          <div className="fa-model-card-cta text-violet-600 group-hover:text-violet-700 dark:text-violet-300 dark:group-hover:text-violet-200">
            Try it →
          </div>
      </div>
    </a>
  );
}
