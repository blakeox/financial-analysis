export interface HomeBuyingAffordabilityInput {
  personalInfo: {
    age: number;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
    dependents: number;
    employmentStatus: 'employed' | 'self-employed' | 'unemployed' | 'retired';
    yearsEmployed: number;
    creditScore: number;
  };
  finances: {
    annualIncome: number;
    monthlyDebtPayments: number;
    downPaymentAvailable: number;
    emergencyFund: number;
    otherAssets: number;
  };
  homePreferences: {
    targetPrice: number;
    location: string;
    homeType: 'single-family' | 'condo' | 'townhouse' | 'multi-family';
    mustHaves: string[];
    niceToHaves: string[];
  };
  goals: {
    timeline: number;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    priority: 'affordability' | 'location' | 'size' | 'investment';
  };
}

export interface HomeBuyingAffordabilityResult {
  summary: {
    maxAffordablePrice: number;
    recommendedDownPayment: number;
    monthlyPayment: number;
    affordabilityScore: number;
  };
  recommendations: string[];
  insights: string[];
}
