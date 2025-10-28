export interface AutoLoanAnalysisInput {
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    price: number;
    downPayment: number;
    tradeInValue: number;
  };
  loanTerms: {
    loanAmount: number;
    interestRate: number;
    termMonths: number;
    loanType: 'new' | 'used' | 'refinance';
  };
  personalInfo: {
    creditScore: number;
    annualIncome: number;
    monthlyDebtPayments: number;
    employmentStatus: 'employed' | 'self-employed' | 'unemployed' | 'retired';
  };
  goals: {
    analysisType: 'loan' | 'lease' | 'comparison';
    priority: 'lowest-payment' | 'lowest-total-cost' | 'flexibility';
  };
}

export interface AutoLoanAnalysisResult {
  summary: {
    monthlyPayment: number;
    totalInterest: number;
    totalCost: number;
    effectiveRate: number;
  };
  recommendations: string[];
  insights: string[];
}
