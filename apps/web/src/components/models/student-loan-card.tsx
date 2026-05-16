import { GraduationCap } from 'lucide-react';
import { getModelCardShellClass, type ModelCardProps } from './types';

export function StudentLoanCard({ className = '' }: ModelCardProps) {
  return (
    <a href="/models/personal-finance/student-loan" className={`block group ${className}`}>
      <div className={getModelCardShellClass('violet')}>
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-violet-100 p-2.5 dark:bg-violet-900/50">
            <GraduationCap className="h-6 w-6 text-violet-600 dark:text-violet-300" />
          </div>
          <h3 className="fa-model-title text-xl">Student Loan Analyzer</h3>
        </div>
        <p className="fa-model-description mb-4 text-sm">
          Optimize student loan repayment with avalanche/snowball strategies, income-driven
          repayment plans (IBR, PAYE, REPAYE), and refinancing analysis.
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="fa-model-card-chip bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
            Payoff Strategies
          </span>
          <span className="fa-model-card-chip bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
            IDR Plans
          </span>
          <span className="fa-model-card-chip bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
            Refinancing
          </span>
        </div>
        <div className="fa-model-card-cta text-violet-600 group-hover:text-violet-700 dark:text-violet-300 dark:group-hover:text-violet-200">
          Try it →
        </div>
      </div>
    </a>
  );
}
