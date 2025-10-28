export interface InsuranceNeedsInput {
  personalInfo: {
    age: number;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
    dependents: number;
    annualIncome: number;
    netWorth: number;
    healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
    occupation: string;
    hobbies: string[];
  };
  currentCoverage: {
    lifeInsurance: number;
    disabilityInsurance: number;
    longTermCareInsurance: number;
  };
  goals: {
    incomeReplacementYears: number;
    educationFunding: number;
    debtPayoff: number;
    finalExpenses: number;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  };
}

export interface InsuranceNeedsResult {
  summary: {
    totalRecommendedCoverage: number;
    totalCoverageGap: number;
    insuranceHealthScore: number;
  };
  recommendations: string[];
  insights: string[];
}
