import { AmortizationAnalyzer, LeaseAnalyzer } from '@financial-analysis/analysis';
import { describe, expect, it } from 'vitest';

describe('analysis engines smoke', () => {
  it('lease analyzer basic scenario', () => {
    const result = LeaseAnalyzer.analyze({
      principal: 50000,
      annualRate: 0.05,
      termMonths: 60,
      residualValue: 10000,
    });
    expect(result.monthlyPayment).toBeGreaterThan(0);
    expect(result.totalInterest).toBeGreaterThan(0);
  });

  it('amortization analyzer basic scenario', () => {
    const result = AmortizationAnalyzer.analyze({
      principal: 10000,
      annualRate: 0.06,
      termMonths: 24,
    });
    // Expect a result object with schedule array
    expect(Array.isArray(result.schedule)).toBe(true);
    expect(result.schedule.length).toBe(24);
    const last = result.schedule[result.schedule.length - 1]!;
    // Remaining balance should be near zero
    expect(Math.abs(last.balance)).toBeLessThan(1e-2);
  });
});
