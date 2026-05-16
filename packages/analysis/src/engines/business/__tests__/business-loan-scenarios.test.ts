import { describe, expect, it } from 'vitest';
import type { BusinessLoanScenariosInput } from '../../../schemas/business-loan-scenarios.js';
import { BusinessLoanScenariosAnalyzer } from '../business-loan-scenarios.js';

describe('BusinessLoanScenariosAnalyzer', () => {
  const baseInput: BusinessLoanScenariosInput = {
    loanAmount: 500_000,
    currentDebtPayments: 2000,
    scenarios: [
      {
        name: 'Term Loan',
        term: 5,
        rate: 0.06,
        description: 'Standard 5-year term loan',
      },
      {
        name: 'Long Term',
        term: 10,
        rate: 0.055,
        description: 'Lower rate, longer term',
      },
    ],
  };

  it('returns scenario analysis and comparison', () => {
    const result = BusinessLoanScenariosAnalyzer.analyze(baseInput) as any;

    expect(result.scenarios).toHaveLength(2);
    expect(result.comparison).toBeDefined();
    expect(result.recommendations).toBeInstanceOf(Array);
  });

  it('calculates monthly payment, total interest, and total cost', () => {
    const result = BusinessLoanScenariosAnalyzer.analyze(baseInput) as any;

    for (const scenario of result.scenarios) {
      expect(scenario.monthlyPayment).toBeGreaterThan(0);
      expect(scenario.totalInterest).toBeGreaterThan(0);
      expect(scenario.totalCost).toBeGreaterThan(baseInput.loanAmount);
      expect(scenario.totalDebtService).toBeGreaterThan(scenario.monthlyPayment);
    }
  });

  it('identifies cheapest scenario by total cost', () => {
    const result = BusinessLoanScenariosAnalyzer.analyze(baseInput) as any;

    const cheapestName = result.comparison.cheapest.scenario;
    const scenariosSorted = [...result.scenarios].sort(
      (a: any, b: any) => a.totalCost - b.totalCost
    );

    expect(cheapestName).toBe(scenariosSorted[0].name);
    expect(result.comparison.cheapest.totalCost).toBeCloseTo(scenariosSorted[0].totalCost, 6);
  });

  it('identifies lowest payment scenario by monthly payment', () => {
    const result = BusinessLoanScenariosAnalyzer.analyze(baseInput) as any;

    const lowestName = result.comparison.lowestPayment.scenario;
    const scenariosSorted = [...result.scenarios].sort(
      (a: any, b: any) => a.monthlyPayment - b.monthlyPayment
    );

    expect(lowestName).toBe(scenariosSorted[0].name);
    expect(result.comparison.lowestPayment.monthlyPayment).toBeCloseTo(
      scenariosSorted[0].monthlyPayment,
      6
    );
  });

  it('calculates savings when multiple scenarios exist', () => {
    const result = BusinessLoanScenariosAnalyzer.analyze(baseInput) as any;

    expect(result.comparison.cheapest.savings).toBeGreaterThanOrEqual(0);
    expect(result.comparison.lowestPayment.savings).toBeGreaterThanOrEqual(0);
  });

  it('returns zero savings when only one scenario exists', () => {
    const input: BusinessLoanScenariosInput = {
      loanAmount: 250_000,
      currentDebtPayments: 0,
      scenarios: [
        {
          name: 'Solo',
          term: 7,
          rate: 0.07,
        },
      ],
    };

    const result = BusinessLoanScenariosAnalyzer.analyze(input) as any;

    expect(result.comparison.cheapest.savings).toBe(0);
    expect(result.comparison.lowestPayment.savings).toBe(0);
    expect(result.recommendations).toHaveLength(0);
  });

  it('includes recommendation strings when multiple scenarios exist', () => {
    const result = BusinessLoanScenariosAnalyzer.analyze(baseInput) as any;

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]).toContain('Lowest total cost');
    expect(result.recommendations[1]).toContain('Lowest monthly payment');
  });
});
