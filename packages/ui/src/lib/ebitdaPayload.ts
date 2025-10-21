import type {
  EmployeeData,
  ExpenseTypeData,
  MonthlyFinancialsData,
  ScenarioConfigData,
  FixedAssetData,
  LeaseData,
} from '..';

export interface DashboardScenarioConfig extends ScenarioConfigData {
  scenarioName: string;
  scenarioDescription?: string;
  operatingExpenseGrowthRate: number;
  billableHoursGrowthRate: number;
  inflationRate: number;
  competitionFactor: number;
  seasonalityFactors?: number[];
}

export interface BuildPayloadParams {
  financials: MonthlyFinancialsData;
  employees: EmployeeData[];
  expenseTypes: ExpenseTypeData[];
  fixedAssets?: FixedAssetData[];
  leases?: LeaseData[];
  scenarioConfig: DashboardScenarioConfig;
  clock?: Date; // for test determinism
}

const monthOrder: Array<keyof MonthlyFinancialsData> = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

const monthIndexMap: Record<keyof MonthlyFinancialsData, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function buildScenarioPayload(params: BuildPayloadParams) {
  const { financials, employees, expenseTypes, fixedAssets = [], leases = [], scenarioConfig } = params;
  const now = params.clock ?? new Date();
  const currentYear = now.getFullYear();

  // Monthly financials baseline
  const monthlyFinancials = monthOrder
    .map((monthKey) => {
      const revenue = financials[monthKey];
      if (revenue === undefined || revenue === null || revenue <= 0) return null;
      return {
        month: monthIndexMap[monthKey],
        year: currentYear,
        revenue,
        costOfGoodsSold: 0,
        operatingExpenses: 0,
        depreciation: 0, // filled after we have assets sum
        amortization: 0,
        interestExpense: 0,
        taxes: 0,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  if (monthlyFinancials.length === 0) {
    throw new Error('Please provide revenue for at least one month before generating a forecast.');
  }

  const currentEmployees = employees.map((employee) => ({
    id: employee.id,
    name: employee.name,
    role: employee.department || 'Employee',
    department: employee.department || 'General',
    billableHoursPerMonth: employee.billableHoursPerMonth ?? 0,
    hourlyRate: employee.hourlyRate ?? 0,
    salary: employee.currentSalary ?? 0,
    benefits: 0,
    startDate: new Date(currentYear, 0, 1).toISOString(),
    isActive: employee.isActive,
  }));

  const expenseMapped = expenseTypes
    .filter((expense) => expense.isActive)
    .map((expense) => ({
      id: expense.id,
      name: expense.name,
      category: expense.category === 'mixed' ? 'semi-variable' : expense.category,
      amount: expense.currentMonthlyAmount,
      frequency: 'monthly' as const,
      isRecurring: true,
      description: `${expense.name} expense`,
      startMonth: 1,
      growthRate: expense.growthRate ?? 0,
    }));

  const assetDepreciation = fixedAssets.filter((a) => a.isActive).reduce((s, a) => s + (a.monthlyDepreciation || 0), 0);
  // Apply assets' monthly depreciation to all included months
  for (const m of monthlyFinancials) {
    m.depreciation = assetDepreciation;
  }

  const leaseExpenses = leases
    .filter((l) => l.isActive)
    .map((l) => ({
      id: `lease-${l.id}`,
      name: `${l.name} Lease`,
      category: 'fixed' as const,
      amount: l.monthlyPayment,
      frequency: 'monthly' as const,
      isRecurring: true,
      description: `Lease payment for ${l.name}`,
      startMonth: 1,
      growthRate: 0,
    }));

  const hasSeasonality = Array.isArray(scenarioConfig.seasonalityFactors) && scenarioConfig.seasonalityFactors.length === 12;
  const marketGrowthRate = clamp(scenarioConfig.marketGrowthFactor - 1, -1, 1);
  const scenarioName = scenarioConfig.scenarioName.trim() || 'EBITDA Forecast Scenario';
  const scenarioDescription = scenarioConfig.scenarioDescription?.trim();

  return {
    name: scenarioName,
    ...(scenarioDescription ? { description: scenarioDescription } : {}),
    forecastPeriodMonths: scenarioConfig.projectionMonths,
    currentMonthlyFinancials: monthlyFinancials,
    currentEmployees,
    newEmployees: [],
    revenueGrowthRate: scenarioConfig.revenueGrowthRate,
    billableHoursGrowthRate: scenarioConfig.billableHoursGrowthRate,
    additionalExpenses: [...expenseMapped, ...leaseExpenses],
    operatingExpenseGrowthRate: scenarioConfig.operatingExpenseGrowthRate,
    inflationRate: scenarioConfig.inflationRate,
    ...(marketGrowthRate !== 0 || scenarioConfig.competitionFactor !== 1 || hasSeasonality
      ? {
          economicFactors: {
            marketGrowth: marketGrowthRate,
            competitionFactor: scenarioConfig.competitionFactor,
            ...(hasSeasonality ? { seasonalityFactors: scenarioConfig.seasonalityFactors } : {}),
          },
        }
      : {}),
  } as const;
}
