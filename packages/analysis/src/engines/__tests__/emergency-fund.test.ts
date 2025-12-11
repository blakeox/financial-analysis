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
});
