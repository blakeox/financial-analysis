/**
 * Employee Stock Options Tests
 */

import { describe, expect, it } from 'vitest';
import { EmployeeStockOptionsInputSchema } from '../../schemas/employee-stock-options.js';
import { EmployeeStockOptionsValuator } from '../employee-stock-options.js';

describe('EmployeeStockOptionsValuator', () => {
  const baseInput = EmployeeStockOptionsInputSchema.parse({
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
  });

  it('should value employee stock options', () => {
    const result = EmployeeStockOptionsValuator.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalIntrinsicValue).toBeGreaterThan(0);
  });

  it('should calculate Black-Scholes valuation when requested', () => {
    const result = EmployeeStockOptionsValuator.analyze(baseInput) as any;
    expect(result.optionValuation).toBeDefined();
    expect(Array.isArray(result.optionValuation.options)).toBe(true);
  });

  it('should analyze tax implications', () => {
    const result = EmployeeStockOptionsValuator.analyze(baseInput) as any;
    expect(result.taxAnalysis).toBeDefined();
  });

  it('should provide exercise scenarios', () => {
    const result = EmployeeStockOptionsValuator.analyze(baseInput) as any;
    expect(result.exerciseScenarios).toBeDefined();
    expect(Array.isArray(result.exerciseScenarios.scenarios)).toBe(true);
  });

  it('should compare ISO vs NSO', () => {
    const nsoInput = EmployeeStockOptionsInputSchema.parse({
      ...baseInput,
      options: [
        {
          ...baseInput.options[0],
          optionType: 'nso',
        },
      ],
    });
    const result = EmployeeStockOptionsValuator.analyze(nsoInput) as any;
    expect(result).toBeDefined();
    expect(result.taxAnalysis).toBeDefined();
  });

  it('uses intrinsic value for expired options', () => {
    const expiredInput = EmployeeStockOptionsInputSchema.parse({
      ...baseInput,
      options: [
        {
          ...baseInput.options[0],
          expirationDate: '2000-01-01',
          currentStockPrice: 80,
          grantPrice: 50,
          numberOfOptions: 10,
        },
      ],
    });

    const result = EmployeeStockOptionsValuator.analyze(expiredInput) as any;
    const valuation = result.optionValuation.options[0];
    expect(valuation.blackScholesValue).toBeCloseTo(300, 2);
    expect(valuation.timeValue).toBeCloseTo(0, 2);
  });

  it('applies AMT exercise tax for ISO when enabled', () => {
    const amtInput = EmployeeStockOptionsInputSchema.parse({
      ...baseInput,
      taxInfo: {
        ...baseInput.taxInfo,
        includeAMT: true,
        federalTaxRate: {
          ...baseInput.taxInfo.federalTaxRate,
          amt: true,
        },
      },
      options: [
        {
          ...baseInput.options[0],
          optionType: 'iso',
          currentStockPrice: 70,
          grantPrice: 50,
          numberOfOptions: 100,
        },
      ],
    });

    const result = EmployeeStockOptionsValuator.analyze(amtInput) as any;
    expect(result.taxAnalysis.options[0].exerciseTax).toBeCloseTo(520, 2);
  });

  it('skips valuation, tax, and scenarios when analysis flags are off', () => {
    const minimalInput = EmployeeStockOptionsInputSchema.parse({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        includeValuation: false,
        includeTaxAnalysis: false,
        includeExerciseScenarios: false,
      },
      exerciseStrategy: {
        ...baseInput.exerciseStrategy,
        includeTaxOptimization: false,
      },
    });

    const result = EmployeeStockOptionsValuator.analyze(minimalInput) as any;
    expect(result.optionValuation).toBeUndefined();
    expect(result.taxAnalysis).toBeUndefined();
    expect(result.exerciseScenarios).toBeUndefined();
    expect(result.recommendations.length).toBe(0);
  });

  it('includes state tax in NSO exercise tax', () => {
    const nsoInput = EmployeeStockOptionsInputSchema.parse({
      ...baseInput,
      options: [
        {
          ...baseInput.options[0],
          optionType: 'nso',
          currentStockPrice: 60,
          grantPrice: 50,
          numberOfOptions: 100,
        },
      ],
      taxInfo: {
        ...baseInput.taxInfo,
        stateTaxRate: 0.05,
      },
    });

    const result = EmployeeStockOptionsValuator.analyze(nsoInput) as any;
    expect(result.taxAnalysis.options[0].exerciseTax).toBeCloseTo(420, 2);
  });
});
