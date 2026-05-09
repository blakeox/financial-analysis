import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import type { ModuleType } from './ModuleSelector';
import { badgeVariants, cn } from '../lib/classNames';

interface ModuleCardProps {
  moduleType: ModuleType;
  label: string;
  icon: string;
  color: string;
  isValid: boolean;
  onRemove: () => void;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  moduleType: _moduleType,
  label,
  icon,
  color,
  isValid,
  onRemove,
  children,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card variant="interactive" className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={`rounded-2xl p-2 shadow-sm ${color}`}>
              <div className="text-2xl">{icon}</div>
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {label}
                {isValid && (
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-1 text-xs font-semibold',
                      badgeVariants.success
                    )}
                    title="Valid data"
                  >
                    Ready
                  </span>
                )}
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2"
            >
              {isExpanded ? '▼' : '▶'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-950/20 dark:hover:text-rose-200"
              title="Remove this section"
            >
              ✕
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && <CardContent>{children}</CardContent>}
    </Card>
  );
};
