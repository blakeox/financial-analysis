import { Input } from './Input';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

export interface ScenarioConfigData {
  projectionMonths: number;
  revenueGrowthRate: number;
  marketGrowthFactor: number;
  seasonalityFactors?: number[];
}

export interface ScenarioConfigProps {
  data: ScenarioConfigData;
  onChange: (data: ScenarioConfigData) => void;
  readonly?: boolean;
}

const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function ScenarioConfig({ data, onChange, readonly = false }: ScenarioConfigProps) {
  const updateField = <K extends keyof ScenarioConfigData>(
    field: K,
    value: ScenarioConfigData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const updateSeasonalityFactor = (monthIndex: number, value: number) => {
    const newFactors = [...(data.seasonalityFactors || Array(12).fill(1))];
    newFactors[monthIndex] = value;
    updateField('seasonalityFactors', newFactors);
  };

  const resetSeasonalityFactors = () => {
    updateField('seasonalityFactors', Array(12).fill(1));
  };

  const hasSeasonalityFactors = data.seasonalityFactors && data.seasonalityFactors.length === 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Projection Period (Months)"
            type="number"
            value={data.projectionMonths}
            onChange={(e) => updateField('projectionMonths', Number(e.target.value))}
            min="1"
            max="60"
            disabled={readonly}
            helperText="Number of months to forecast (1-60)"
          />
          
          <Input
            label="Revenue Growth Rate (%)"
            type="number"
            value={(data.revenueGrowthRate * 100).toFixed(2)}
            onChange={(e) => updateField('revenueGrowthRate', Number(e.target.value) / 100)}
            step="0.1"
            min="-50"
            max="100"
            disabled={readonly}
            helperText="Monthly revenue growth rate"
          />

          <Input
            label="Market Growth Factor"
            type="number"
            value={data.marketGrowthFactor.toFixed(2)}
            onChange={(e) => updateField('marketGrowthFactor', Number(e.target.value))}
            step="0.1"
            min="0.1"
            max="3"
            disabled={readonly}
            helperText="Market conditions multiplier (1.0 = normal)"
          />
        </div>

        {/* Summary */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
          <h4 className="font-medium mb-2">Scenario Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Forecast Period:</span>{' '}
              {data.projectionMonths} months ({Math.round(data.projectionMonths / 12 * 10) / 10} years)
            </div>
            <div>
              <span className="font-medium">Annual Growth Rate:</span>{' '}
              {((Math.pow(1 + data.revenueGrowthRate, 12) - 1) * 100).toFixed(1)}%
            </div>
            <div>
              <span className="font-medium">Market Conditions:</span>{' '}
              {data.marketGrowthFactor > 1.1 ? 'Favorable' : 
               data.marketGrowthFactor < 0.9 ? 'Challenging' : 'Normal'}
            </div>
          </div>
        </div>

        {/* Seasonality Factors */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Seasonality Factors (Optional)</h4>
            {!readonly && (
              <div className="space-x-2">
                {!hasSeasonalityFactors ? (
                  <button
                    type="button"
                    onClick={() => updateField('seasonalityFactors', Array(12).fill(1))}
                    className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Enable Seasonality
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resetSeasonalityFactors}
                    className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Reset to 1.0
                  </button>
                )}
              </div>
            )}
          </div>

          {hasSeasonalityFactors && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Adjust monthly multipliers to account for seasonal variations (1.0 = normal, 1.2 = 20% above normal, 0.8 = 20% below normal)
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {months.map((month, index) => (
                  <Input
                    key={month}
                    label={month}
                    type="number"
                    value={(data.seasonalityFactors?.[index] || 1).toFixed(2)}
                    onChange={(e) => updateSeasonalityFactor(index, Number(e.target.value))}
                    step="0.1"
                    min="0.1"
                    max="5"
                    disabled={readonly}
                  />
                ))}
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-md">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Average Factor:</strong>{' '}
                  {((data.seasonalityFactors?.reduce((sum, factor) => sum + factor, 0) || 12) / 12).toFixed(2)}
                  {Math.abs(((data.seasonalityFactors?.reduce((sum, factor) => sum + factor, 0) || 12) / 12) - 1) > 0.05 && (
                    <span className="ml-2 text-orange-600 dark:text-orange-400">
                      ⚠️ Consider balancing factors around 1.0 for realistic projections
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}