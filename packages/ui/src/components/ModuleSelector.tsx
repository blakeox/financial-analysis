import React from 'react';
import { badgeVariants, cn, textColors } from '../lib/classNames';

export type ModuleType =
  'financials' | 'employees' | 'expenses' | 'scenario' | 'fixed-assets' | 'leases';

export interface ModuleDefinition {
  id: ModuleType;
  label: string;
  icon: string;
  description: string;
  cardClass: string;
}

const AVAILABLE_MODULES: ModuleDefinition[] = [
  {
    id: 'financials',
    label: 'Monthly Revenue',
    icon: '💰',
    description: 'Add monthly revenue data',
    cardClass:
      'border-emerald-200 bg-emerald-50/90 hover:border-emerald-300 hover:bg-emerald-100/90 dark:border-emerald-900/70 dark:bg-emerald-950/25',
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: '👥',
    description: 'Add employee data and hiring plans',
    cardClass:
      'border-violet-200 bg-violet-50/90 hover:border-violet-300 hover:bg-violet-100/90 dark:border-violet-900/70 dark:bg-violet-950/25',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: '📊',
    description: 'Add expense categories',
    cardClass:
      'border-amber-200 bg-amber-50/90 hover:border-amber-300 hover:bg-amber-100/90 dark:border-amber-900/70 dark:bg-amber-950/25',
  },
  {
    id: 'fixed-assets',
    label: 'Fixed Assets',
    icon: '🏗️',
    description: 'Add assets with depreciation',
    cardClass:
      'border-sky-200 bg-sky-50/90 hover:border-sky-300 hover:bg-sky-100/90 dark:border-sky-900/70 dark:bg-sky-950/25',
  },
  {
    id: 'leases',
    label: 'Leases',
    icon: '🧾',
    description: 'Add recurring lease payments',
    cardClass:
      'border-cyan-200 bg-cyan-50/90 hover:border-cyan-300 hover:bg-cyan-100/90 dark:border-cyan-900/70 dark:bg-cyan-950/25',
  },
  {
    id: 'scenario',
    label: 'Scenario Config',
    icon: '⚙️',
    description: 'Configure projection parameters',
    cardClass:
      'border-fuchsia-200 bg-fuchsia-50/90 hover:border-fuchsia-300 hover:bg-fuchsia-100/90 dark:border-fuchsia-900/70 dark:bg-fuchsia-950/25',
  },
];

interface ModuleSelectorProps {
  activeModules: ModuleType[];
  onAddModule: (moduleType: ModuleType) => void;
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({ activeModules, onAddModule }) => {
  const availableToAdd = AVAILABLE_MODULES.filter((module) => !activeModules.includes(module.id));

  if (availableToAdd.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Add Input Sections
          </h3>
          <p className={cn('mt-1 text-sm', textColors.secondary)}>
            Select the data you want to include in your forecast
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableToAdd.map((module) => (
          <button
            key={module.id}
            onClick={() => onAddModule(module.id)}
            className={cn(
              module.cardClass,
              'rounded-[1.35rem] border-2 p-4 text-left shadow-[0_10px_24px_rgba(9,14,36,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(9,14,36,0.08)] active:translate-y-0'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">{module.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 font-semibold text-slate-900 dark:text-white">
                  {module.label}
                </div>
                <div className={cn('text-sm', textColors.secondary)}>{module.description}</div>
                <div className="mt-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                      badgeVariants.default
                    )}
                  >
                    Add section
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export { AVAILABLE_MODULES };
