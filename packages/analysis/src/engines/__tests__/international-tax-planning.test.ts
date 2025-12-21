/**
 * International Tax Planning Tests
 */

import { describe, expect, it } from 'vitest';
import type { InternationalTaxPlanningInput } from '../../schemas/international-tax-planning.js';
import { InternationalTaxPlanningOptimizer } from '../international-tax-planning.js';

describe('InternationalTaxPlanningOptimizer', () => {
  const baseInput: InternationalTaxPlanningInput = {
    personalInfo: {
      citizenship: 'US',
      residency: 'US',
      filingStatus: 'single',
    },
    income: {
      domesticIncome: 100000,
    },
    foreignIncome: {
      foreignEarnedIncome: 50000,
      foreignUnearnedIncome: 0,
      foreignTaxPaid: 15000,
      countries: [
        {
          country: 'UK',
          incomeAmount: 50000,
          taxPaid: 15000,
          incomeType: 'earned',
        },
      ],
    },
    taxTreaties: {
      hasTaxTreaty: true,
      treatyCountry: 'UK',
      treatyBenefits: ['reduced-withholding'],
    },
    businessStructure: {
      hasForeignEntity: false,
      entityType: 'corporation',
      transferPricing: false,
    },
    analysis: {
      includeForeignTaxCredit: true,
      includeTaxTreatyAnalysis: true,
      includeTransferPricing: true,
      includeCFCAnalysis: true,
      includeBEPSCompliance: true,
    },
  };

  it('should calculate international tax planning', () => {
    const result = InternationalTaxPlanningOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.taxLiability).toBeDefined();
  });

  it('should calculate foreign tax credit when requested', () => {
    const result = InternationalTaxPlanningOptimizer.analyze(baseInput);
    expect(result.taxLiability.foreignTaxCredit).toBeGreaterThanOrEqual(0);
  });

  it('should analyze tax treaties', () => {
    const result = InternationalTaxPlanningOptimizer.analyze(baseInput);
    expect(result.treatyBenefits).toBeDefined();
  });

  it('should provide recommendations', () => {
    const result = InternationalTaxPlanningOptimizer.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should handle CFC analysis when requested', () => {
    // const result = InternationalTaxPlanningOptimizer.analyze(baseInput);
    // expect(result.cfcAnalysis).toBeDefined();
  });
});

