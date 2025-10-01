import React from 'react';

export type ModuleType = 'financials' | 'employees' | 'expenses' | 'scenario';

export interface ModuleDefinition {
  id: ModuleType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const AVAILABLE_MODULES: ModuleDefinition[] = [
  {
    id: 'financials',
    label: 'Monthly Revenue',
    icon: '💰',
    description: 'Add monthly revenue data',
    color: 'bg-green-100 hover:bg-green-200 border-green-300',
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: '👥',
    description: 'Add employee data and hiring plans',
    color: 'bg-blue-100 hover:bg-blue-200 border-blue-300',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: '📊',
    description: 'Add expense categories',
    color: 'bg-orange-100 hover:bg-orange-200 border-orange-300',
  },
  {
    id: 'scenario',
    label: 'Scenario Config',
    icon: '⚙️',
    description: 'Configure projection parameters',
    color: 'bg-purple-100 hover:bg-purple-200 border-purple-300',
  },
];

interface ModuleSelectorProps {
  activeModules: ModuleType[];
  onAddModule: (moduleType: ModuleType) => void;
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  activeModules,
  onAddModule,
}) => {
  const availableToAdd = AVAILABLE_MODULES.filter(
    (module) => !activeModules.includes(module.id)
  );

  if (availableToAdd.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Input Sections
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Select the data you want to include in your forecast
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableToAdd.map((module) => (
          <button
            key={module.id}
            onClick={() => onAddModule(module.id)}
            className={`${module.color} border-2 rounded-xl p-4 transition-all hover:shadow-md hover:scale-105 active:scale-95 text-left`}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">{module.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {module.label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {module.description}
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
