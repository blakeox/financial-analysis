/**
 * Employee Stock Options Tests
 */

import { describe, expect, it } from 'vitest';
import type { EmployeeStockOptionsInput } from '../../schemas/employee-stock-options.js';
import { EmployeeStockOptionsValuator } from '../employee-stock-options.js';

describe('EmployeeStockOptionsValuator', () => {
  const baseInput: EmployeeStockOptionsInput = {
    personalInfo: {
      age: 35,
      currentSalary: 150000,
      expectedRetirementAge: 65,
    },
    options: [
      {
        grantDate: '2023-01-01',
        grantPrice: 50,
        numberOfOptions: 1000,
        expirationDate: '2033-01-01',
        optionType: 'iso',
        currentStockPrice: 75,
        vestingSchedule: {
          vestingType: 'graded',
          vestingPeriod: 4,
        },
      },
    ],
    taxInfo: {
      federalTaxRate: {
        ordinary: 0.37,
        capitalGains: 0.2,
      },
      includeAMT: true,
    },
    exerciseStrategy: {
      strategy: 'exercise-at-vest',
      includeTaxOptimization: true,
    },
    analysis: {
      includeValuation: true,
      includeTaxAnalysis: true,
      includeExerciseScenarios: true,
      projectionYears: 10,
    },
  };

  it('should value employee stock options', () => {
    const result = EmployeeStockOptionsValuator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalValue).toBeGreaterThan(0);
  });

  it('should calculate Black-Scholes valuation when requested', () => {
    const result = EmployeeStockOptionsValuator.analyze(baseInput);
    expect(result.valuations).toBeDefined();
    expect(Array.isArray(result.valuations)).toBe(true);
  });

  it('should analyze tax implications', () => {
    const result = EmployeeStockOptionsValuator.analyze(baseInput);
    expect(result.taxAnalysis).toBeDefined();
  });

  it('should provide exercise scenarios', () => {
    const result = EmployeeStockOptionsValuator.analyze(baseInput);
    expect(result.exerciseScenarios).toBeDefined();
    expect(Array.isArray(result.exerciseScenarios)).toBe(true);
  });

  it('should compare ISO vs NSO', () => {
    const nsoInput: EmployeeStockOptionsInput = {
      ...baseInput,
      options: [
        {
          ...baseInput.options[0],
          optionType: 'nso',
        },
      ],
    };
    const result = EmployeeStockOptionsValuator.analyze(nsoInput);
    expect(result).toBeDefined();
    expect(result.taxAnalysis).toBeDefined();
  });
});
