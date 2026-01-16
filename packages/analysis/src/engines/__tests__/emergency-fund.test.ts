/**
 * Emergency Fund Calculator Tests
 */

import { describe, expect, it } from 'vitest';
import type { EmergencyFundInput } from '../../schemas/emergency-fund.js';
import { EmergencyFundCalculator } from '../emergency-fund.js';

describe('EmergencyFundCalculator', () => {
  const baseInput: EmergencyFundInput = {
    currentSituation: {
      monthlyExpenses: 5000,
      monthlyIncome: 8000,
      currentEmergencyFund: 10000,
      dependents: 0,
      employmentStatus: 'employed',
    },
    goals: {
      targetMonths: 6,
      priority: 'build-gradually',
    },
    assumptions: {
      monthlySavings: 2000,
      expectedReturn: 0.02,
    },
    analysis: {
      includeTimeline: true,
      includeScenarios: true,
    },
  };

  const cloneInput = (): EmergencyFundInput =>
    JSON.parse(JSON.stringify(baseInput)) as EmergencyFundInput;

  it('should calculate target emergency fund', () => {
    const result = EmergencyFundCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.targetFund).toBeDefined();
    expect(result.targetFund.targetAmount).toBeGreaterThan(0);
  });

  it('should calculate build timeline when requested', () => {
    const result = EmergencyFundCalculator.analyze(baseInput);
    expect(result.buildTimeline).toBeDefined();
    expect(result.buildTimeline?.monthsToBuild).toBeGreaterThan(0);
  });

  it('should analyze withdrawal scenarios', () => {
    const result = EmergencyFundCalculator.analyze(baseInput);
    expect(result.withdrawalScenarios).toBeDefined();
    expect(result.withdrawalScenarios.scenarios.length).toBeGreaterThan(0);
  });

  it('should analyze scenarios when requested', () => {
    const result = EmergencyFundCalculator.analyze(baseInput);
    expect(result.scenarios).toBeDefined();
    expect(result.scenarios?.conservative).toBeDefined();
    expect(result.scenarios?.moderate).toBeDefined();
    expect(result.scenarios?.aggressive).toBeDefined();
  });

  it('adjusts target for dependents and self-employment', () => {
    const input = cloneInput();
    input.currentSituation.dependents = 2;
    input.currentSituation.employmentStatus = 'self-employed';

    const result = EmergencyFundCalculator.analyze(input);
    expect(result.targetFund.monthlyExpenses).toBeCloseTo(9500, 6);
    expect(result.targetFund.targetAmount).toBeCloseTo(57000, 6);
    expect(result.targetFund.interpretation).toContain('Adequate');
  });

  it('flags below-minimum targets for low month goals', () => {
    const input = cloneInput();
    input.goals.targetMonths = 2;

    const result = EmergencyFundCalculator.analyze(input);
    expect(result.targetFund.interpretation).toContain('Below recommended minimum');
  });

  it('omits timeline and scenarios when disabled', () => {
    const input = cloneInput();
    input.analysis.includeTimeline = false;
    input.analysis.includeScenarios = false;

    const result = EmergencyFundCalculator.analyze(input);
    expect(result.buildTimeline).toBeUndefined();
    expect(result.scenarios).toBeUndefined();
    expect(result.withdrawalScenarios).toBeDefined();
  });

  it('marks target met and includes quick-build guidance when on track', () => {
    const input = cloneInput();
    input.goals.priority = 'build-quickly';
    input.currentSituation.currentEmergencyFund = 40000;
    input.analysis.includeTimeline = true;

    const result = EmergencyFundCalculator.analyze(input);
    expect(result.summary.onTrack).toBe(true);
    expect(result.buildTimeline?.monthsToBuild).toBe(999);
    expect(result.recommendations).toContain('✅ Emergency fund target met!');
    expect(result.recommendations).toContain(
      'Prioritize building emergency fund quickly - consider reducing other expenses temporarily'
    );
  });
});
