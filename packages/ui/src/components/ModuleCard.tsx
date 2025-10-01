import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import type { ModuleType } from './ModuleSelector';

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
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={`p-2 ${color} rounded-lg`}>
              <div className="text-2xl">{icon}</div>
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                {label}
                {isValid && (
                  <span className="text-green-500 text-lg" title="Valid data">
                    ✓
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
              className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
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
