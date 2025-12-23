import { describe, it, expect } from 'vitest';
import { BusinessLoanScenariosAnalyzer } from '../business-loan-scenarios';
import { BusinessLoanScenariosInput } from '../../../schemas/business-loan-scenarios';

describe('BusinessLoanScenariosAnalyzer', () => {
  const basicInput: BusinessLoanScenariosInput = {
    loanAmount: 100000,
    scenarios: [
      {
        name: 'Scenario A',
        term: 5,
        rate: 0.05,
        description: 'Short term, low rate',
      },
      {
        name: 'Scenario B',
        term: 10,
        rate: 0.07,
        description: 'Long term, high rate',
      },
    ],
    currentDebtPayments: 1000,
  };

  it('should compare loan scenarios', () => {
    const result = BusinessLoanScenariosAnalyzer.analyze(basicInput);
    expect(result.scenarios).toHaveLength(2);
    expect(result.comparison).toBeDefined();
  });

  it('should return all required fields in the analysis result', () => {
    const result = BusinessLoanScenariosAnalyzer.analyze(basicInput);
    expect(result).toHaveProperty('scenarios');
    expect(result).toHaveProperty('comparison');
    expect(result).toHaveProperty('recommendations');
  });
});
