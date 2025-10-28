export interface FinancialJourneyInput {
  personalInfo: {
    age: number;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
    dependents: number;
    employmentStatus: 'employed' | 'self-employed' | 'unemployed' | 'retired';
    education: 'high-school' | 'some-college' | 'bachelors' | 'masters' | 'phd';
  };
  currentFinancials: {
    annualIncome: number;
    monthlyExpenses: number;
    totalDebt: number;
    emergencyFund: number;
    retirementSavings: number;
    otherAssets: number;
  };
  goals: {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    timeHorizon: number;
  };
}

export interface FinancialJourneyResult {
  summary: {
    currentStage: string;
    overallFinancialHealth: number;
    nextMilestone: string;
    estimatedTimeToNext: string;
  };
  recommendations: string[];
  insights: string[];
}
