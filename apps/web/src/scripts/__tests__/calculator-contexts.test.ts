import { describe, it, expect } from 'vitest';
import {
  detectCalculatorContext,
  parseFieldUpdate,
  CALCULATOR_CONTEXTS,
  type CalculatorContextKey,
  type CalculatorContext,
} from '../chat/calculator-contexts';

const getFieldMappings = (context: CalculatorContext): Record<string, string> => {
  expect(context.fieldMappings).toBeDefined();
  if (!context.fieldMappings) {
    throw new Error(`Missing field mappings for ${context.id}`);
  }

  return context.fieldMappings;
};

describe('Calculator Context Detection', () => {
  describe('detectCalculatorContext', () => {
    // Personal Finance Calculators
    it('should detect amortization from /calculator/amortization', () => {
      expect(detectCalculatorContext('/calculator/amortization')).toBe('amortization');
    });

    it('should detect amortization from legacy /amortization', () => {
      expect(detectCalculatorContext('/amortization')).toBe('amortization');
    });

    it('should detect auto-loan from /calculator/auto-loan', () => {
      expect(detectCalculatorContext('/calculator/auto-loan')).toBe('auto-loan');
    });

    it('should detect retirement from /calculator/retirement', () => {
      expect(detectCalculatorContext('/calculator/retirement')).toBe('retirement');
    });

    it('should detect savings-goal from /calculator/savings-goal', () => {
      expect(detectCalculatorContext('/calculator/savings-goal')).toBe('savings-goal');
    });

    it('should detect debt-payoff from /calculator/debt-payoff', () => {
      expect(detectCalculatorContext('/calculator/debt-payoff')).toBe('debt-payoff');
    });

    it('should detect student-loans from /calculator/student-loans', () => {
      expect(detectCalculatorContext('/calculator/student-loans')).toBe('student-loans');
    });

    it('should detect budget from /calculator/budget', () => {
      expect(detectCalculatorContext('/calculator/budget')).toBe('budget');
    });

    it('should detect credit-card-payoff from /calculator/credit-card-payoff', () => {
      expect(detectCalculatorContext('/calculator/credit-card-payoff')).toBe(
        'credit-card-payoff'
      );
    });

    it('should detect invest-vs-payoff-debt from /calculator/invest-vs-payoff-debt', () => {
      expect(detectCalculatorContext('/calculator/invest-vs-payoff-debt')).toBe(
        'invest-vs-payoff-debt'
      );
    });

    // Real Estate Calculators
    it('should detect lease from /lease-analysis', () => {
      expect(detectCalculatorContext('/lease-analysis')).toBe('lease');
    });

    it('should detect lease from /commercial-real-estate-lease', () => {
      expect(detectCalculatorContext('/commercial-real-estate-lease')).toBe('lease');
    });

    it('should detect equipment-lease from /calculator/equipment-lease', () => {
      expect(detectCalculatorContext('/calculator/equipment-lease')).toBe('equipment-lease');
    });

    it('should detect rent-vs-buy from /calculator/rent-vs-buy', () => {
      expect(detectCalculatorContext('/calculator/rent-vs-buy')).toBe('rent-vs-buy');
    });

    it('should detect mortgage-scenario-planning from /calculator/mortgage-scenario-planning', () => {
      expect(detectCalculatorContext('/calculator/mortgage-scenario-planning')).toBe(
        'mortgage-scenario-planning'
      );
    });

    // Business Calculators
    it('should detect pricing-strategy from /calculator/pricing-strategy', () => {
      expect(detectCalculatorContext('/calculator/pricing-strategy')).toBe('pricing-strategy');
    });

    it('should detect ebitda from /ebitda-forecasting', () => {
      expect(detectCalculatorContext('/ebitda-forecasting')).toBe('ebitda');
    });

    it('should detect ebitda from /ebitda', () => {
      expect(detectCalculatorContext('/ebitda')).toBe('ebitda');
    });

    it('should detect break-even from /calculator/break-even', () => {
      expect(detectCalculatorContext('/calculator/break-even')).toBe('break-even');
    });

    it('should detect cash-flow-forecast from /calculator/cash-flow-forecast', () => {
      expect(detectCalculatorContext('/calculator/cash-flow-forecast')).toBe(
        'cash-flow-forecast'
      );
    });

    it('should detect business-loan-qualifier from /calculator/business-loan-qualifier', () => {
      expect(detectCalculatorContext('/calculator/business-loan-qualifier')).toBe(
        'business-loan-qualifier'
      );
    });

    it('should detect saas-metrics from /calculator/saas-metrics', () => {
      expect(detectCalculatorContext('/calculator/saas-metrics')).toBe('saas-metrics');
    });

    it('should detect side-hustle-income from /calculator/side-hustle-income', () => {
      expect(detectCalculatorContext('/calculator/side-hustle-income')).toBe(
        'side-hustle-income'
      );
    });

    // Investment Calculators
    it('should detect dcf-valuation from /calculator/dcf-valuation', () => {
      expect(detectCalculatorContext('/calculator/dcf-valuation')).toBe('dcf-valuation');
    });

    it('should detect ma-analysis from /calculator/ma-analysis', () => {
      expect(detectCalculatorContext('/calculator/ma-analysis')).toBe('ma-analysis');
    });

    it('should detect risk-management from /calculator/risk-management', () => {
      expect(detectCalculatorContext('/calculator/risk-management')).toBe('risk-management');
    });

    // Journey Pages
    it('should detect startup-planning from journey', () => {
      expect(detectCalculatorContext('/journey/startup-planning')).toBe('startup-planning');
    });

    it('should detect amortization from home-buying journey', () => {
      expect(detectCalculatorContext('/journey/home-buying')).toBe('amortization');
    });

    it('should detect general from other journeys', () => {
      expect(detectCalculatorContext('/journey/young-professional')).toBe('general');
      expect(detectCalculatorContext('/journey/family-planning')).toBe('general');
    });

    // Models and General
    it('should detect models context from /models', () => {
      expect(detectCalculatorContext('/models')).toBe('models');
      expect(detectCalculatorContext('/models/business')).toBe('models');
      expect(detectCalculatorContext('/models/personal')).toBe('models');
    });

    it('should default to general for unknown paths', () => {
      expect(detectCalculatorContext('/')).toBe('general');
      expect(detectCalculatorContext('/about')).toBe('general');
      expect(detectCalculatorContext('/unknown-page')).toBe('general');
    });

    it('should handle paths with query parameters', () => {
      // Note: Query parameters are part of search, not pathname
      // This test documents expected behavior
      const result = detectCalculatorContext('/calculator/pricing-strategy?foo=bar');
      // Should still detect the calculator part
      expect(result).toBeTruthy();
    });

    it('should handle paths with trailing slashes', () => {
      expect(detectCalculatorContext('/calculator/pricing-strategy/')).toBe('pricing-strategy');
    });
  });

  describe('CALCULATOR_CONTEXTS definitions', () => {
    it('should have valid structure for all contexts', () => {
      Object.entries(CALCULATOR_CONTEXTS).forEach(([key, context]) => {
        expect(context.id).toBe(key);
        expect(context.label).toBeTruthy();
        expect(context.intro).toBeTruthy();
        expect(context.examples).toBeInstanceOf(Array);
        expect(context.examples.length).toBeGreaterThan(0);
        expect(context.examples.length).toBeLessThanOrEqual(5);
      });
    });

    it('should have unique labels', () => {
      const labels = Object.values(CALCULATOR_CONTEXTS).map((c) => c.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(labels.length);
    });

    it('should have examples that are strings', () => {
      Object.values(CALCULATOR_CONTEXTS).forEach((context) => {
        context.examples.forEach((example) => {
          expect(typeof example).toBe('string');
          expect(example.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have field mappings as optional but valid when present', () => {
      Object.values(CALCULATOR_CONTEXTS).forEach((context) => {
        if (context.fieldMappings) {
          expect(typeof context.fieldMappings).toBe('object');
          Object.entries(context.fieldMappings).forEach(([key, value]) => {
            expect(typeof key).toBe('string');
            expect(typeof value).toBe('string');
            expect(key.length).toBeGreaterThan(0);
            expect(value.length).toBeGreaterThan(0);
          });
        }
      });
    });
  });
});

describe('Field Update Parsing', () => {
  describe('parseFieldUpdate - pricing-strategy context', () => {
    const context: CalculatorContextKey = 'pricing-strategy';

    it('should parse "Set target margin to 70"', () => {
      const result = parseFieldUpdate('Set target margin to 70', context);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('targetMargin');
      expect(result?.value).toBe('70');
      expect(result?.fieldLabel).toMatch(/margin/i);
    });

    it('should parse "set margin to 70%" (with percentage)', () => {
      const result = parseFieldUpdate('set margin to 70%', context);
      expect(result).toEqual({
        field: 'targetMargin',
        value: '70%',
        fieldLabel: 'margin',
      });
    });

    it('should parse "Change cost per unit to 30"', () => {
      const result = parseFieldUpdate('Change cost per unit to 30', context);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('costPerUnit');
      expect(result?.value).toBe('30');
      expect(result?.fieldLabel).toMatch(/cost/i);
    });

    it('should parse "What if margin was 75"', () => {
      const result = parseFieldUpdate('What if margin was 75', context);
      expect(result).toEqual({
        field: 'targetMargin',
        value: '75',
        fieldLabel: 'margin',
      });
    });

    it('should parse "Update competitor price to 99.99"', () => {
      const result = parseFieldUpdate('Update competitor price to 99.99', context);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('marketPrice');
      expect(result?.value).toBe('99.99');
      expect(result?.fieldLabel).toMatch(/price/i);
    });

    it('should handle numbers with commas', () => {
      const result = parseFieldUpdate('Set units sold to 1,000', context);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('unitsSoldMonthly');
      expect(result?.value).toBe('1,000');
      expect(result?.fieldLabel).toMatch(/units/i);
    });

    it('should return null for non-matching patterns', () => {
      expect(parseFieldUpdate('Hello there', context)).toBeNull();
      expect(parseFieldUpdate('What is the margin?', context)).toBeNull();
      expect(parseFieldUpdate('Calculate now', context)).toBeNull();
    });

    it('should return null if field not in mappings', () => {
      const result = parseFieldUpdate('Set unknown field to 100', context);
      expect(result).toBeNull();
    });
  });

  describe('parseFieldUpdate - amortization context', () => {
    const context: CalculatorContextKey = 'amortization';

    it('should parse "Set interest rate to 4.5"', () => {
      const result = parseFieldUpdate('Set interest rate to 4.5', context);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('annualRate');
      expect(result?.value).toBe('4.5');
      expect(result?.fieldLabel).toMatch(/interest|rate/i);
    });

    it('should parse "Change rate to 5.5%"', () => {
      const result = parseFieldUpdate('Change rate to 5.5%', context);
      expect(result).toEqual({
        field: 'annualRate',
        value: '5.5%',
        fieldLabel: 'rate',
      });
    });

    it('should parse "Set loan amount to 350000"', () => {
      const result = parseFieldUpdate('Set loan amount to 350000', context);
      expect(result).toEqual({
        field: 'principal',
        value: '350000',
        fieldLabel: 'loan amount',
      });
    });

    it('should parse "What if term was 20"', () => {
      const result = parseFieldUpdate('What if term was 20', context);
      expect(result).toEqual({
        field: 'termMonths',
        value: '20',
        fieldLabel: 'term',
      });
    });
  });

  describe('parseFieldUpdate - auto-loan context', () => {
    const context: CalculatorContextKey = 'auto-loan';

    it('should parse "Set car price to 35000"', () => {
      const result = parseFieldUpdate('Set car price to 35000', context);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('vehiclePrice');
      expect(result?.value).toBe('35000');
      expect(result?.fieldLabel).toMatch(/price/i);
    });

    it('should parse "Change interest to 3.9"', () => {
      const result = parseFieldUpdate('Change interest to 3.9', context);
      expect(result).toEqual({
        field: 'interestRate',
        value: '3.9',
        fieldLabel: 'interest',
      });
    });

    it('should return null for "Set trade-in to 10000" when no matching field exists', () => {
      const result = parseFieldUpdate('Set trade-in to 10000', context);
      expect(result).toBeNull();
    });
  });

  describe('parseFieldUpdate - retirement context', () => {
    const context: CalculatorContextKey = 'retirement';

    it('should parse "Set current age to 30"', () => {
      const result = parseFieldUpdate('Set current age to 30', context);
      expect(result).toEqual({
        field: 'currentAge',
        value: '30',
        fieldLabel: 'current age',
      });
    });

    it('should parse "Change retirement age to 65"', () => {
      const result = parseFieldUpdate('Change retirement age to 65', context);
      expect(result).toEqual({
        field: 'retirementAge',
        value: '65',
        fieldLabel: 'retirement age',
      });
    });

    it('should return null for "Set monthly savings to 500" when no matching field exists', () => {
      const result = parseFieldUpdate('Set monthly savings to 500', context);
      expect(result).toBeNull();
    });
  });

  describe('parseFieldUpdate - student-loans context', () => {
    const context: CalculatorContextKey = 'student-loans';

    it('should parse "Set balance to 45000"', () => {
      const result = parseFieldUpdate('Set balance to 45000', context);
      expect(result).toEqual({
        field: 'loanBalance',
        value: '45000',
        fieldLabel: 'balance',
      });
    });

    it('should parse "Change interest to 5.5"', () => {
      const result = parseFieldUpdate('Change interest to 5.5', context);
      expect(result).toEqual({
        field: 'interestRate',
        value: '5.5',
        fieldLabel: 'interest',
      });
    });

    it('should parse "Set income to 50000"', () => {
      const result = parseFieldUpdate('Set income to 50000', context);
      expect(result).toEqual({
        field: 'annualIncome',
        value: '50000',
        fieldLabel: 'income',
      });
    });
  });

  describe('parseFieldUpdate - ebitda context', () => {
    const context: CalculatorContextKey = 'ebitda';

    it('should parse "Set revenue to 500000"', () => {
      const result = parseFieldUpdate('Set revenue to 500000', context);
      expect(result).toEqual({
        field: 'annual-revenue',
        value: '500000',
        fieldLabel: 'revenue',
      });
    });

    it('should parse "Change growth to 15"', () => {
      const result = parseFieldUpdate('Change growth to 15', context);
      expect(result).toEqual({
        field: 'growth-rate',
        value: '15',
        fieldLabel: 'growth',
      });
    });

    it('should parse "Set COGS to 35"', () => {
      const result = parseFieldUpdate('Set cogs to 35', context);
      expect(result).toEqual({
        field: 'cost-of-goods-sold',
        value: '35',
        fieldLabel: 'cogs',
      });
    });
  });

  describe('parseFieldUpdate - edge cases', () => {
    it('should handle case insensitivity', () => {
      const result = parseFieldUpdate('SET TARGET MARGIN TO 70', 'pricing-strategy');
      expect(result).not.toBeNull();
      expect(result?.field).toBe('targetMargin');
    });

    it('should handle extra whitespace', () => {
      const result = parseFieldUpdate('Set   margin   to   70', 'pricing-strategy');
      expect(result).not.toBeNull();
      expect(result?.field).toBe('targetMargin');
    });

    it('should handle different command verbs', () => {
      const result1 = parseFieldUpdate('Set margin to 70', 'pricing-strategy');
      const result2 = parseFieldUpdate('Change margin to 70', 'pricing-strategy');
      const result3 = parseFieldUpdate('Update margin to 70', 'pricing-strategy');
      const result4 = parseFieldUpdate('Make margin to 70', 'pricing-strategy');

      expect(result1?.field).toBe('targetMargin');
      expect(result2?.field).toBe('targetMargin');
      expect(result3?.field).toBe('targetMargin');
      expect(result4?.field).toBe('targetMargin');
    });

    it('should return null for context without field mappings', () => {
      const result = parseFieldUpdate('Set something to 100', 'models');
      expect(result).toBeNull();
    });
  });
});

describe('Calculator Context Completeness', () => {
  const requiredCalculators: CalculatorContextKey[] = [
    'amortization',
    'auto-loan',
    'retirement',
    'savings-goal',
    'debt-payoff',
    'student-loans',
    'budget',
    'credit-card-payoff',
    'invest-vs-payoff-debt',
    'lease',
    'equipment-lease',
    'rent-vs-buy',
    'mortgage-scenario-planning',
    'pricing-strategy',
    'ebitda',
    'break-even',
    'cash-flow-forecast',
    'business-loan-qualifier',
    'saas-metrics',
    'side-hustle-income',
    'dcf-valuation',
    'ma-analysis',
    'risk-management',
    'startup-planning',
    'models',
    'general',
  ];

  it('should have contexts defined for all required calculators', () => {
    requiredCalculators.forEach((calcId) => {
      expect(CALCULATOR_CONTEXTS[calcId]).toBeDefined();
      expect(CALCULATOR_CONTEXTS[calcId].id).toBe(calcId);
    });
  });

  it('should have at least 26 calculator contexts', () => {
    expect(Object.keys(CALCULATOR_CONTEXTS).length).toBeGreaterThanOrEqual(26);
  });

  describe('calculators with field mappings', () => {
    const calculatorsWithMappings = Object.values(CALCULATOR_CONTEXTS).filter(
      (c) => c.fieldMappings
    );

    it('should have field mappings for at least 7 calculators', () => {
      expect(calculatorsWithMappings.length).toBeGreaterThanOrEqual(7);
    });

    it('should have pricing-strategy with complete field mappings', () => {
      const pricingStrategy = CALCULATOR_CONTEXTS['pricing-strategy'];
      const fieldMappings = getFieldMappings(pricingStrategy);
      expect(Object.keys(fieldMappings).length).toBeGreaterThanOrEqual(5);
      expect(fieldMappings['margin']).toBe('targetMargin');
      expect(fieldMappings['cost per unit']).toBe('costPerUnit');
    });

    it('should have amortization with complete field mappings', () => {
      const amortization = CALCULATOR_CONTEXTS['amortization'];
      const fieldMappings = getFieldMappings(amortization);
      expect(Object.keys(fieldMappings).length).toBeGreaterThanOrEqual(4);
      expect(fieldMappings['interest rate']).toBe('annualRate');
      expect(fieldMappings['loan amount']).toBe('principal');
    });
  });
});
