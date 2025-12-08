import { InsuranceNeedsInput } from '../../insurance-needs';

/**
 * Provides a fresh copy of the canonical insurance-needs input used across helper suites.
 */
export function createBaseInsuranceInput(): InsuranceNeedsInput {
  return {
    personalInfo: {
      age: 40,
      maritalStatus: 'married',
      dependents: 2,
      employmentStatus: 'employed',
      healthStatus: 'good',
      occupation: 'Engineer',
      annualIncome: 100000,
      monthlyExpenses: 5000,
    },
    currentInsurance: {
      lifeInsurance: {
        termLife: {
          coverage: 250000,
          termYears: 20,
          monthlyPremium: 50,
        },
        wholeLife: {
          coverage: 0,
          cashValue: 0,
          monthlyPremium: 0,
        },
      },
      disabilityInsurance: {
        shortTerm: {
          coverage: 3000,
          waitingPeriod: 14,
          benefitPeriod: 90,
          monthlyPremium: 30,
        },
        longTerm: {
          coverage: 5000,
          waitingPeriod: 90,
          benefitPeriod: 60,
          monthlyPremium: 80,
        },
      },
      longTermCare: {
        coverage: 0,
        dailyBenefit: 0,
        benefitPeriod: 0,
        eliminationPeriod: 0,
        monthlyPremium: 0,
      },
      healthInsurance: {
        coverage: 'employer-provided',
        monthlyPremium: 200,
        deductible: 1500,
        outOfPocketMax: 6000,
      },
    },
    financialSituation: {
      totalAssets: 500000,
      totalDebts: 200000,
      emergencyFund: 30000,
      retirementSavings: 150000,
      otherIncome: 0,
      socialSecurityBenefit: 0,
    },
    goals: {
      incomeReplacementRatio: 0.7,
      debtPayoffGoal: true,
      educationFunding: 100000,
      retirementGoal: 1000000,
      legacyGoal: 50000,
    },
    analysis: {
      includeLifeInsurance: true,
      includeDisabilityInsurance: true,
      includeLongTermCare: true,
      includeHealthInsurance: false,
      inflationRate: 0.03,
      discountRate: 0.05,
      lifeExpectancy: 85,
    },
  };
}
