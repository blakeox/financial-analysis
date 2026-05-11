import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { parsers } from '../lib/formUtils';
import { cardVariants, cn, inputClasses, textColors } from '../lib/classNames';

export interface ScenarioConfigData {
  scenarioName: string;
  scenarioDescription?: string;
  projectionMonths: number;
  revenueGrowthRate: number;
  marketGrowthFactor: number;
  operatingExpenseGrowthRate: number;
  billableHoursGrowthRate: number;
  inflationRate: number;
  competitionFactor: number;
  seasonalityFactors?: number[];
}

export interface ScenarioConfigProps {
  data: ScenarioConfigData;
  onChange: (data: ScenarioConfigData) => void;
  readonly?: boolean;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

const describeCompetition = (factor: number) => {
  if (factor <= 0.85) return 'Low competitive pressure';
  if (factor >= 1.15) return 'High competitive pressure';
  return 'Moderate competition';
};

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
    <Card variant="interactive">
      <CardHeader>
        <CardTitle>Scenario Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Naming */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-4">
          <Input
            label="Scenario Name"
            value={data.scenarioName}
            onChange={(e) => updateField('scenarioName', e.target.value)}
            disabled={readonly}
            placeholder="e.g. Growth Plan FY25"
          />
          <div className="space-y-1">
            <label
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              htmlFor="scenario-description"
            >
              Scenario Description
            </label>
            <textarea
              id="scenario-description"
              value={data.scenarioDescription ?? ''}
              onChange={(e) => updateField('scenarioDescription', e.target.value)}
              disabled={readonly}
              rows={3}
              placeholder="Short summary of assumptions and goals"
              className={cn(inputClasses, 'min-h-[96px] py-3')}
            />
          </div>
        </div>

        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Projection Period (Months)"
            type="number"
            value={data.projectionMonths}
            onChange={(e) => updateField('projectionMonths', parsers.number(e.target.value))}
            min="1"
            max="60"
            disabled={readonly}
            helperText="Number of months to forecast (1-60)"
          />

          <Input
            label="Revenue Growth Rate (%)"
            type="number"
            value={(data.revenueGrowthRate * 100).toFixed(2)}
            onChange={(e) => updateField('revenueGrowthRate', parsers.percentage(e.target.value))}
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
            onChange={(e) => updateField('marketGrowthFactor', parsers.number(e.target.value))}
            step="0.1"
            min="0.1"
            max="2"
            disabled={readonly}
            helperText="Market conditions multiplier (1.0 = normal)"
          />
        </div>

        {/* Advanced Growth Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Operating Expense Growth (%)"
            type="number"
            value={(data.operatingExpenseGrowthRate * 100).toFixed(2)}
            onChange={(e) =>
              updateField('operatingExpenseGrowthRate', parsers.percentage(e.target.value))
            }
            step="0.1"
            min="-50"
            max="100"
            disabled={readonly}
            helperText="Monthly operating expense growth"
          />
          <Input
            label="Billable Hours Growth (%)"
            type="number"
            value={(data.billableHoursGrowthRate * 100).toFixed(2)}
            onChange={(e) => updateField('billableHoursGrowthRate', parsers.percentage(e.target.value))}
            step="0.1"
            min="-50"
            max="100"
            disabled={readonly}
            helperText="Monthly growth in billable hours"
          />
          <Input
            label="Inflation Rate (%)"
            type="number"
            value={(data.inflationRate * 100).toFixed(2)}
            onChange={(e) => updateField('inflationRate', parsers.percentage(e.target.value))}
            step="0.1"
            min="0"
            max="100"
            disabled={readonly}
            helperText="Annual inflation assumption"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Competition Factor"
            type="number"
            value={data.competitionFactor.toFixed(2)}
            onChange={(e) => updateField('competitionFactor', parsers.number(e.target.value))}
            step="0.05"
            min="0.1"
            max="2"
            disabled={readonly}
            helperText="Higher values represent tougher competition"
          />
        </div>

        {/* Summary */}
        <div className={cn(cardVariants.subtle, 'p-4')}>
          <h4 className={cn('mb-2 font-semibold', textColors.primary)}>Scenario Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className={textColors.secondary}>
              <span className="font-medium">Forecast Period:</span> {data.projectionMonths} months (
              {Math.round((data.projectionMonths / 12) * 10) / 10} years)
            </div>
            <div className={textColors.secondary}>
              <span className="font-medium">Annual Growth Rate:</span>{' '}
              {((Math.pow(1 + data.revenueGrowthRate, 12) - 1) * 100).toFixed(1)}%
            </div>
            <div className={textColors.secondary}>
              <span className="font-medium">Market Conditions:</span>{' '}
              {data.marketGrowthFactor > 1.1
                ? 'Favorable'
                : data.marketGrowthFactor < 0.9
                  ? 'Challenging'
                  : 'Normal'}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
            <div className={textColors.secondary}>
              <span className="font-medium">OpEx Growth:</span>{' '}
              {formatPercent(data.operatingExpenseGrowthRate)} monthly
            </div>
            <div className={textColors.secondary}>
              <span className="font-medium">Billable Hours Growth:</span>{' '}
              {formatPercent(data.billableHoursGrowthRate)} monthly
            </div>
            <div className={textColors.secondary}>
              <span className="font-medium">Inflation Assumption:</span>{' '}
              {formatPercent(data.inflationRate)} annually
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-3">
            <div className={textColors.secondary}>
              <span className="font-medium">Competition Outlook:</span>{' '}
              {describeCompetition(data.competitionFactor)}
            </div>
            <div className={textColors.secondary}>
              <span className="font-medium">Competition Factor:</span>{' '}
              {data.competitionFactor.toFixed(2)}
            </div>
            {data.seasonalityFactors && (
              <div className={textColors.secondary}>
                <span className="font-medium">Seasonality Avg:</span>{' '}
                {(
                  (data.seasonalityFactors.reduce((sum, factor) => sum + factor, 0) || 0) /
                  (data.seasonalityFactors.length || 1)
                ).toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Seasonality Factors */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className={cn('font-semibold', textColors.primary)}>Seasonality Factors (Optional)</h4>
            {!readonly && (
              <div className="space-x-2">
                {!hasSeasonalityFactors ? (
                  <Button
                    type="button"
                    onClick={() => updateField('seasonalityFactors', Array(12).fill(1))}
                    size="sm"
                  >
                    Enable Seasonality
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={resetSeasonalityFactors}
                    variant="secondary"
                    size="sm"
                  >
                    Reset to 1.0
                  </Button>
                )}
              </div>
            )}
          </div>

          {hasSeasonalityFactors && (
            <div className="space-y-3">
              <p className={cn('text-sm', textColors.secondary)}>
                Adjust monthly multipliers to account for seasonal variations (1.0 = normal, 1.2 =
                20% above normal, 0.8 = 20% below normal)
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {months.map((month, index) => (
                  <Input
                    key={month}
                    label={month}
                    type="number"
                    value={(data.seasonalityFactors?.[index] || 1).toFixed(2)}
                    onChange={(e) => updateSeasonalityFactor(index, parsers.number(e.target.value))}
                    step="0.1"
                    min="0.1"
                    max="5"
                    disabled={readonly}
                  />
                ))}
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50/80 p-3 dark:border-violet-900/70 dark:bg-violet-950/25">
                <div className={cn('text-sm', textColors.accent)}>
                  <strong>Average Factor:</strong>{' '}
                  {(
                    (data.seasonalityFactors?.reduce((sum, factor) => sum + factor, 0) || 12) / 12
                  ).toFixed(2)}
                  {Math.abs(
                    (data.seasonalityFactors?.reduce((sum, factor) => sum + factor, 0) || 12) / 12 -
                      1
                  ) > 0.05 && (
                    <span className="ml-2 text-amber-600 dark:text-amber-300">
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
