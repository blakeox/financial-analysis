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

  it('should apply top tax bracket for high income inputs', () => {
    const highIncomeInput: InternationalTaxPlanningInput = {
      personalInfo: {
        citizenship: 'US',
        residenceCountry: 'US',
        filingStatus: 'single',
        taxYear: 2024,
      },
      foreignIncome: {
        foreignEarnedIncome: 1_000_000,
        foreignUnearnedIncome: 0,
        foreignTaxPaid: 0,
        foreignTaxRate: 0,
        countries: [
          {
            country: 'CA',
            income: 1_000_000,
            taxPaid: 0,
          },
        ],
      },
      feie: {
        eligibleForFEIE: false,
        physicalPresenceTest: false,
        bonaFideResidenceTest: false,
        daysAbroad: 0,
        feieLimit: 126500,
        housingExclusion: 0,
      },
      foreignTaxCredit: {
        eligibleForFTC: false,
        foreignTaxPaid: 0,
        foreignIncome: 0,
        useFTC: true,
      },
      foreignAssets: {
        foreignBankAccounts: [],
        foreignFinancialAssets: [],
        fbarRequired: false,
        fatcaRequired: false,
      },
      taxTreaties: [],
      analysis: {
        includeFEIEvsFTC: true,
        includeTaxSavings: true,
        includeComplianceCheck: true,
        includeOptimization: true,
      },
    };

    const result = InternationalTaxPlanningCalculator.analyze(highIncomeInput);
    expect(result.summary.usFederalTax).toBeGreaterThan(0);
  });

  it('should normalize legacy country entries with fallback values', () => {
    const legacyInput = {
      personalInfo: {
        citizenship: 'US',
        residency: 'US',
        filingStatus: 'single',
      },
      income: {
        domesticIncome: 0,
        foreignIncome: 40000,
        foreignTaxPaid: 8000,
      },
      foreignIncome: {
        countries: [
          {
            country: undefined,
            incomeAmount: undefined,
            taxPaid: undefined,
          },
        ],
      },
      taxTreaties: {
        hasTaxTreaty: true,
        treatyCountry: 'DE',
        treatyBenefits: [],
      },
      analysis: {
        includeForeignTaxCredit: true,
        includeTaxTreatyAnalysis: false,
        includeTransferPricing: false,
        includeCFCAnalysis: false,
        includeBEPSCompliance: false,
      },
    };

    const result = InternationalTaxPlanningCalculator.analyze(legacyInput);
    expect(result.summary.foreignTax).toBe(8000);
    expect(result.taxTreatyAnalysis.treatyCountry).toBe('DE');
  });

  it('should handle married filing status with normalized input', () => {
    const marriedInput: InternationalTaxPlanningInput = {
      personalInfo: {
        citizenship: 'US',
        residenceCountry: 'US',
        filingStatus: 'married-joint',
        taxYear: 2024,
      },
      foreignIncome: {
        foreignEarnedIncome: 200000,
        foreignUnearnedIncome: 0,
        foreignTaxPaid: 0,
        foreignTaxRate: 0,
        countries: [
          {
            country: 'FR',
            income: 200000,
            taxPaid: 0,
          },
        ],
      },
      feie: {
        eligibleForFEIE: false,
        physicalPresenceTest: false,
        bonaFideResidenceTest: false,
        daysAbroad: 0,
        feieLimit: 126500,
        housingExclusion: 0,
      },
      foreignTaxCredit: {
        eligibleForFTC: false,
        foreignTaxPaid: 0,
        foreignIncome: 0,
        useFTC: true,
      },
      foreignAssets: {
        foreignBankAccounts: [],
        foreignFinancialAssets: [],
        fbarRequired: false,
        fatcaRequired: false,
      },
      taxTreaties: [],
      analysis: {
        includeFEIEvsFTC: true,
        includeTaxSavings: true,
        includeComplianceCheck: true,
        includeOptimization: true,
      },
    };

    const result = InternationalTaxPlanningCalculator.analyze(marriedInput);
    expect(result.summary.usFederalTax).toBeGreaterThan(0);
  });

  it('should default legacy fields when missing tax treaties and income', () => {
    const legacyInput = {
      personalInfo: {
        citizenship: 'US',
        residency: 'US',
      },
      analysis: {
        includeForeignTaxCredit: false,
        includeTaxTreatyAnalysis: false,
        includeTransferPricing: false,
        includeCFCAnalysis: false,
        includeBEPSCompliance: false,
      },
    };

    const result = InternationalTaxPlanningCalculator.analyze(legacyInput);
    expect(result.summary.foreignTax).toBe(0);
    expect(result.taxTreatyAnalysis.hasTaxTreaty).toBe(false);
    expect(result.taxTreatyAnalysis.treatyBenefits.length).toBe(0);
  });

  it('should normalize legacy inputs with explicit country and missing treaty metadata', () => {
    const legacyInput = {
      income: {
        foreignIncome: 120000,
        foreignTaxPaid: 24000,
      },
      foreignIncome: {
        countries: [
          {
            country: 'JP',
            incomeAmount: 120000,
            taxPaid: 24000,
          },
        ],
      },
      taxTreaties: {
        hasTaxTreaty: true,
      },
      analysis: {
        includeForeignTaxCredit: true,
        includeTaxTreatyAnalysis: true,
        includeTransferPricing: false,
        includeCFCAnalysis: false,
        includeBEPSCompliance: false,
      },
    };

    const result = InternationalTaxPlanningCalculator.analyze(legacyInput);
    expect(result.summary.foreignTax).toBe(24000);
    expect(result.taxTreatyAnalysis.treatyCountry).toBe('Unknown');
    expect(result.taxTreatyAnalysis.treatyBenefits.length).toBe(0);
  });

  it('should default to unknown country when legacy entries omit country data', () => {
    const legacyInput = {
      personalInfo: {
        filingStatus: 'single',
      },
      income: {
        foreignIncome: 5000,
        foreignTaxPaid: 500,
      },
      foreignIncome: {
        countries: [
          {
            incomeAmount: 5000,
            taxPaid: 500,
          },
        ],
      },
      analysis: {
        includeForeignTaxCredit: true,
        includeTaxTreatyAnalysis: false,
        includeTransferPricing: false,
        includeCFCAnalysis: false,
        includeBEPSCompliance: false,
      },
    };

    const result = InternationalTaxPlanningCalculator.analyze(legacyInput);
    expect(result.summary.foreignTax).toBe(500);
    expect(result.taxTreatyAnalysis.treatyCountry).toBe('Unknown');
  });
});

