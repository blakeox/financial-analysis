export interface TaxOptimizationInput {
  personalInfo: {
    age: number;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
    dependents: number;
    stateOfResidence: string;
    occupation: string;
  };
  income: {
    annualSalary: number;
    bonus: number;
    investmentIncome: number;
    rentalIncome: number;
    otherIncome: number;
  };
  deductions: {
    mortgageInterest: number;
    propertyTaxes: number;
    charitableContributions: number;
    medicalExpenses: number;
    otherDeductions: number;
  };
  investments: {
    taxableAccounts: number;
    traditionalIRA: number;
    rothIRA: number;
    employer401k: number;
    otherRetirement: number;
  };
  goals: {
    taxStrategy: 'minimize-current' | 'minimize-lifetime' | 'balanced';
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    timeHorizon: number;
  };
}

export interface TaxOptimizationResult {
  summary: {
    currentTaxLiability: number;
    optimizedTaxLiability: number;
    potentialSavings: number;
    optimizationScore: number;
  };
  recommendations: string[];
  insights: string[];
}
