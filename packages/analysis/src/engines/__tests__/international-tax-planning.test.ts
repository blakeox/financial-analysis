/**
 * International Tax Planning Tests
 */

import { describe, expect, it } from 'vitest';
import type { InternationalTaxPlanningInput } from '../../schemas/international-tax-planning.js';
import { InternationalTaxPlanningCalculator } from '../international-tax-planning.js';

describe('InternationalTaxPlanningCalculator', () => {
  const baseInput: InternationalTaxPlanningInput = {
    personalInfo: {
      citizenship: 'US',
      residency: 'US',
      filingStatus: 'single',
    },
    income: {
      domesticIncome: 100000,
      foreignIncome: 50000,
      foreignTaxPaid: 15000,
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
    const result = InternationalTaxPlanningCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should calculate foreign tax credit when requested', () => {
    const result = InternationalTaxPlanningCalculator.analyze(baseInput);
    expect(result.foreignTaxCredit).toBeDefined();
    expect(result.foreignTaxCredit.creditAmount).toBeGreaterThanOrEqual(0);
  });

  it('should analyze tax treaties', () => {
    const result = InternationalTaxPlanningCalculator.analyze(baseInput);
    expect(result.taxTreatyAnalysis).toBeDefined();
  });

  it('should provide recommendations', () => {
    const result = InternationalTaxPlanningCalculator.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should handle CFC analysis when requested', () => {
    const result = InternationalTaxPlanningCalculator.analyze(baseInput);
    expect(result.cfcAnalysis).toBeDefined();
  });
});
