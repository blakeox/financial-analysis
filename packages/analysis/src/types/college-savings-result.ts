export interface CollegeSavingsInput {
  familyInfo: {
    numberOfChildren: number;
    children: Array<{
      name: string;
      age: number;
      expectedCollegeStartAge: number;
      expectedGraduationAge: number;
      collegeType: 'private' | 'public' | 'community' | 'ivy-league';
      specialNeeds: boolean;
      expectedMajor?: string;
    }>;
    stateOfResidence: string;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  };
  currentSavings: {
    total529Balance: number;
    totalCoverdellBalance: number;
    totalOtherSavings: number;
    monthlyContribution: number;
  };
  goals: {
    targetCoverage: number;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    investmentStrategy: 'age-based' | 'static' | 'custom';
  };
}

export interface CollegeSavingsResult {
  summary: {
    totalProjectedCost: number;
    totalCurrentSavings: number;
    savingsGap: number;
    successProbability: number;
  };
  costProjections: Array<{
    year: number;
    publicInState: number;
    publicOutOfState: number;
    private: number;
  }>;
  recommendations: string[];
  insights: string[];
}
