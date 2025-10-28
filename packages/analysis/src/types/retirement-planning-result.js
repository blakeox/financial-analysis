export interface RetirementPlanningInput {
  personalInfo: {
    age: number;
    retirementAge: number;
    lifeExpectancy: number;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
    dependents: number;
  };
  currentAccounts: Array<{
    type: '401k' | 'ira' | 'roth-ira' | 'pension' | 'savings';
    balance: number;
    annualContribution: number;
    employerMatch?: number;
    expectedReturn: number;
  }>;
  income: {
    currentAnnual: number;
    expectedGrowthRate: number;
    socialSecurity?: number;
  };
  expenses: {
    currentAnnual: number;
    retirementAnnual: number;
    inflationRate: number;
  };
  goals: {
    targetRetirementIncome: number;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    taxStrategy: 'traditional-first' | 'roth-first' | 'balanced';
  };
}

export interface RetirementPlanningResult {
  summary: {
    totalRetirementSavings: number;
    projectedRetirementIncome: number;
    incomeReplacementRatio: number;
    retirementReadinessScore: number;
  };
  accountProjections: Array<{
    type: string;
    currentBalance: number;
    projectedBalance: number;
    annualContribution: number;
    totalContributions: number;
    totalGrowth: number;
  }>;
  recommendations: string[];
  insights: string[];
}
