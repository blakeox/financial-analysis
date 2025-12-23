/**
 * Emergency Fund Calculator Tests
 */

import { describe, expect, it } from 'vitest';
import type { EmergencyFundInput } from '../../../schemas/emergency-fund.js';
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

  it('should provide comprehensive analysis with summary and recommendations', () => {
    const result = EmergencyFundCalculator.analyze(baseInput);
    
    // Check summary
    expect(result.summary).toBeDefined();
    expect(result.summary.targetFund).toBeDefined();
    expect(result.summary.currentFund).toBeDefined();
    expect(result.summary.shortfall).toBeDefined();
    expect(result.summary.monthsToBuild).toBeDefined();
    expect(result.summary.onTrack).toBeDefined();
    
    // Check recommendations
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(typeof result.recommendations[0]).toBe('string');
  });
});
