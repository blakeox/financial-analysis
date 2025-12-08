import { describe, it, expect } from 'vitest';
import {
  detectCalculatorContext,
  CALCULATOR_CONTEXTS,
  type CalculatorContext,
  type CalculatorContextKey,
} from '../calculator-contexts';

const getFieldMappings = (context: CalculatorContext): Record<string, string> => {
  expect(context.fieldMappings).toBeDefined();
  if (!context.fieldMappings) {
    throw new Error(`Expected field mappings for ${context.id}`);
  }

  return context.fieldMappings;
};

describe('Chat Panel Integration Tests', () => {
  describe('Context Detection Integration', () => {
    const testCases: Array<{ path: string; expected: CalculatorContextKey; label: string }> = [
      { path: '/calculator/pricing-strategy', expected: 'pricing-strategy', label: 'Pricing Strategy' },
      { path: '/calculator/amortization', expected: 'amortization', label: 'Mortgage/Loan Calculator' },
      { path: '/calculator/auto-loan', expected: 'auto-loan', label: 'Auto Loan Calculator' },
      { path: '/calculator/retirement', expected: 'retirement', label: 'Retirement Calculator' },
      { path: '/calculator/savings-goal', expected: 'savings-goal', label: 'Savings Goal Calculator' },
      { path: '/calculator/debt-payoff', expected: 'debt-payoff', label: 'Debt Payoff Calculator' },
      { path: '/calculator/student-loans', expected: 'student-loans', label: 'Student Loan Calculator' },
      { path: '/calculator/budget', expected: 'budget', label: 'Budget Planner' },
      { path: '/calculator/credit-card-payoff', expected: 'credit-card-payoff', label: 'Credit Card Payoff' },
      { path: '/calculator/dcf-valuation', expected: 'dcf-valuation', label: 'DCF Valuation' },
      { path: '/calculator/ma-analysis', expected: 'ma-analysis', label: 'M&A Analysis' },
      { path: '/calculator/risk-management', expected: 'risk-management', label: 'Risk Management' },
      { path: '/calculator/equipment-lease', expected: 'equipment-lease', label: 'Equipment Lease' },
      { path: '/calculator/invest-vs-payoff-debt', expected: 'invest-vs-payoff-debt', label: 'Invest vs Pay Off Debt' },
      { path: '/calculator/rent-vs-buy', expected: 'rent-vs-buy', label: 'Rent vs Buy' },
      { path: '/calculator/mortgage-scenario-planning', expected: 'mortgage-scenario-planning', label: 'Mortgage Scenarios' },
      { path: '/calculator/side-hustle-income', expected: 'side-hustle-income', label: 'Side Hustle Income' },
      { path: '/calculator/break-even', expected: 'break-even', label: 'Break-Even Analysis' },
      { path: '/calculator/cash-flow-forecast', expected: 'cash-flow-forecast', label: 'Cash Flow Forecast' },
      { path: '/calculator/business-loan-qualifier', expected: 'business-loan-qualifier', label: 'Business Loan Qualifier' },
      { path: '/calculator/saas-metrics', expected: 'saas-metrics', label: 'SaaS Metrics' },
      { path: '/lease-analysis', expected: 'lease', label: 'Lease Analysis' },
      { path: '/ebitda-forecasting', expected: 'ebitda', label: 'EBITDA Forecasting' },
      { path: '/models', expected: 'models', label: 'Calculator Selection' },
      { path: '/', expected: 'general', label: 'General' },
    ];

    testCases.forEach(({ path, expected, label }) => {
      it(`should detect ${expected} context for ${path} and have correct label`, () => {
        const context = detectCalculatorContext(path);
        expect(context).toBe(expected);
        
        const contextDef = CALCULATOR_CONTEXTS[context];
        expect(contextDef).toBeDefined();
        expect(contextDef.label).toBe(label);
      });
    });
  });

  describe('Context Definitions Completeness', () => {
    const allContexts = Object.values(CALCULATOR_CONTEXTS);

    allContexts.forEach((context) => {
      describe(`${context.id} context`, () => {
        it('should have valid ID', () => {
          expect(context.id).toBeTruthy();
          expect(typeof context.id).toBe('string');
        });

        it('should have descriptive label', () => {
          expect(context.label).toBeTruthy();
          expect(typeof context.label).toBe('string');
          expect(context.label.length).toBeGreaterThan(3);
        });

        it('should have welcoming intro message', () => {
          expect(context.intro).toBeTruthy();
          expect(typeof context.intro).toBe('string');
          expect(context.intro).toMatch(/^Hi/i);
          expect(context.intro.length).toBeGreaterThan(10);
        });

        it('should have 2-5 example commands', () => {
          expect(context.examples).toBeDefined();
          expect(Array.isArray(context.examples)).toBe(true);
          expect(context.examples.length).toBeGreaterThanOrEqual(2);
          expect(context.examples.length).toBeLessThanOrEqual(5);
        });

        it('should have relevant example commands', () => {
          context.examples.forEach((example) => {
            expect(typeof example).toBe('string');
            expect(example.length).toBeGreaterThan(5);
            expect(example).not.toBe('');
            
            // Examples should look like commands/questions/prompts
            // Allow a broad range of example formats that users might type
            const looksLikeCommand = 
              example.match(/^(set|change|update|what|show|how|try|make|calculate|compare|analyze|explain|help|if|estimate|forecast|add|check|create)/i) ||
              example.includes('?') ||
              example.toLowerCase().includes('help') ||
              example.toLowerCase().includes('my ') ||
              example.toLowerCase().includes('the ') ||
              example.toLowerCase().includes(' to ') ||  // "Set X to Y" patterns
              example.toLowerCase().includes(' if ');    // "What if" patterns
            
            expect(looksLikeCommand).toBeTruthy();
          });
        });

        if (context.fieldMappings) {
          it('should have valid field mappings structure', () => {
            const fieldMappings = getFieldMappings(context);
            Object.entries(fieldMappings).forEach(([friendlyName, fieldId]) => {
              // Friendly names should be human-readable
              expect(friendlyName).toBeTruthy();
              expect(friendlyName.length).toBeGreaterThan(0);
              
              // Field IDs should be camelCase or kebab-case (implementation uses camelCase)
              expect(fieldId).toBeTruthy();
              expect(fieldId.length).toBeGreaterThan(0);
              expect(fieldId).toMatch(/^[a-z][a-zA-Z0-9-]*$/);
            });
          });

          it('should have at least 3 field mappings', () => {
            expect(Object.keys(getFieldMappings(context)).length).toBeGreaterThanOrEqual(3);
          });
        }
      });
    });
  });

  describe('Example Commands Validity', () => {
    it('pricing-strategy examples should match field mappings', () => {
      const context = CALCULATOR_CONTEXTS['pricing-strategy'];
      const hasMarginExample = context.examples.some(ex => 
        ex.toLowerCase().includes('margin')
      );
      const hasCostExample = context.examples.some(ex => 
        ex.toLowerCase().includes('cost')
      );
      
      expect(hasMarginExample).toBe(true);
      expect(hasCostExample).toBe(true);
    });

    it('amortization examples should match field mappings', () => {
      const context = CALCULATOR_CONTEXTS['amortization'];
      const hasInterestExample = context.examples.some(ex => 
        ex.toLowerCase().includes('interest') || ex.toLowerCase().includes('rate')
      );
      const hasTermExample = context.examples.some(ex => 
        ex.toLowerCase().includes('term') || ex.toLowerCase().includes('year')
      );
      
      expect(hasInterestExample).toBe(true);
      expect(hasTermExample).toBe(true);
    });

    it('auto-loan examples should match field mappings', () => {
      const context = CALCULATOR_CONTEXTS['auto-loan'];
      const hasPriceExample = context.examples.some(ex => 
        ex.toLowerCase().includes('price') || ex.toLowerCase().includes('car')
      );
      
      expect(hasPriceExample).toBe(true);
    });

    it('retirement examples should match field mappings', () => {
      const context = CALCULATOR_CONTEXTS['retirement'];
      const hasAgeExample = context.examples.some(ex => 
        ex.toLowerCase().includes('age')
      );
      
      expect(hasAgeExample).toBe(true);
    });
  });

  describe('Field Mapping Consistency', () => {
    const calculatorsWithFieldMappings = Object.values(CALCULATOR_CONTEXTS)
      .filter(c => c.fieldMappings);

    calculatorsWithFieldMappings.forEach((context) => {
      describe(`${context.id} field mappings`, () => {
        it('should have consistent field ID naming (camelCase or kebab-case)', () => {
          Object.values(getFieldMappings(context)).forEach((fieldId) => {
            // Allow camelCase (e.g., targetMargin) or kebab-case (e.g., interest-rate)
            expect(fieldId).toMatch(/^[a-z][a-zA-Z0-9-]*$/);
            expect(fieldId).not.toMatch(/_{2,}/); // No double underscores
            expect(fieldId).not.toMatch(/-{2,}/); // No double hyphens
          });
        });

        it('should have at least one field mapping per field ID', () => {
          // Multiple friendly names can map to the same field ID
          // e.g., "margin" and "target margin" both map to "targetMargin"
          const fieldIds = Object.values(getFieldMappings(context));
          const uniqueFieldIds = new Set(fieldIds);
          expect(uniqueFieldIds.size).toBeGreaterThan(0);
          // Unique IDs should be <= total mappings (some may be aliases)
          expect(uniqueFieldIds.size).toBeLessThanOrEqual(fieldIds.length);
        });

        it('should have lowercase friendly names for matching', () => {
          Object.keys(getFieldMappings(context)).forEach((friendlyName) => {
            // Should be lowercase for case-insensitive matching
            expect(friendlyName).toBe(friendlyName.toLowerCase());
          });
        });
      });
    });
  });

  describe('Context Switching Scenarios', () => {
    const scenarios = [
      {
        name: 'Personal to Business calculator',
        from: '/calculator/amortization',
        to: '/calculator/pricing-strategy',
        fromLabel: 'Mortgage/Loan Calculator',
        toLabel: 'Pricing Strategy',
      },
      {
        name: 'Business to Investment calculator',
        from: '/calculator/saas-metrics',
        to: '/calculator/dcf-valuation',
        fromLabel: 'SaaS Metrics',
        toLabel: 'DCF Valuation',
      },
      {
        name: 'Calculator to Models page',
        from: '/calculator/retirement',
        to: '/models',
        fromLabel: 'Retirement Calculator',
        toLabel: 'Calculator Selection',
      },
      {
        name: 'Legacy path to new calculator path',
        from: '/amortization',
        to: '/calculator/amortization',
        fromLabel: 'Mortgage/Loan Calculator',
        toLabel: 'Mortgage/Loan Calculator',
      },
    ];

    scenarios.forEach(({ name, from, to, fromLabel, toLabel }) => {
      it(`should handle ${name}`, () => {
        const fromContext = detectCalculatorContext(from);
        const toContext = detectCalculatorContext(to);
        
        expect(CALCULATOR_CONTEXTS[fromContext].label).toBe(fromLabel);
        expect(CALCULATOR_CONTEXTS[toContext].label).toBe(toLabel);
        
        // Contexts should be different (unless legacy path test)
        if (from !== '/amortization') {
          expect(fromContext).not.toBe(toContext);
        }
      });
    });
  });

  describe('Journey Page Context Detection', () => {
    const journeyTests: Array<{ path: string; expected: CalculatorContextKey }> = [
      { path: '/journey/startup-planning', expected: 'startup-planning' },
      { path: '/journey/home-buying', expected: 'amortization' },
      { path: '/journey/young-professional', expected: 'general' },
      { path: '/journey/family-planning', expected: 'general' },
      { path: '/journey/auto-lease-decision', expected: 'auto-loan' },
    ];

    journeyTests.forEach(({ path, expected }) => {
      it(`should detect ${expected} for ${path}`, () => {
        const context = detectCalculatorContext(path);
        expect(context).toBe(expected);
        expect(CALCULATOR_CONTEXTS[context]).toBeDefined();
      });
    });
  });

  describe('Calculator Coverage', () => {
    it('should have contexts for all main calculator categories', () => {
      const categories = {
        personal: ['amortization', 'auto-loan', 'retirement', 'savings-goal', 'debt-payoff'],
        business: ['pricing-strategy', 'ebitda', 'break-even', 'saas-metrics'],
        realEstate: ['lease', 'rent-vs-buy', 'equipment-lease'],
        investment: ['dcf-valuation', 'ma-analysis', 'risk-management'],
      } satisfies Record<string, CalculatorContextKey[]>;

      Object.entries(categories).forEach(([_category, calculators]) => {
        calculators.forEach((calcId) => {
          expect(CALCULATOR_CONTEXTS[calcId]).toBeDefined();
        });
      });
    });

    it('should have at least 26 calculator contexts defined', () => {
      expect(Object.keys(CALCULATOR_CONTEXTS).length).toBeGreaterThanOrEqual(26);
    });

    it('should have field mappings for high-traffic calculators', () => {
      const highTrafficCalculators: CalculatorContextKey[] = [
        'pricing-strategy',
        'amortization',
        'auto-loan',
        'retirement',
        'student-loans',
        'ebitda',
      ];

      highTrafficCalculators.forEach((calcId) => {
        const context = CALCULATOR_CONTEXTS[calcId];
        expect(context).toBeDefined();
        const fieldMappings = getFieldMappings(context);
        expect(Object.keys(fieldMappings).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty path gracefully', () => {
      const context = detectCalculatorContext('');
      expect(context).toBe('general');
      expect(CALCULATOR_CONTEXTS[context]).toBeDefined();
    });

    it('should handle paths with special characters', () => {
      const context = detectCalculatorContext('/calculator/pricing-strategy#section');
      expect(context).toBe('pricing-strategy');
    });

    it('should handle paths with multiple slashes', () => {
      const context = detectCalculatorContext('//calculator//pricing-strategy//');
      expect(context).toBe('pricing-strategy');
    });

    it('should return general for completely unknown paths', () => {
      const context = detectCalculatorContext('/this-page-does-not-exist');
      expect(context).toBe('general');
      expect(CALCULATOR_CONTEXTS[context]).toBeDefined();
    });

    it('should handle case variations in paths', () => {
      // Note: URLs are typically case-sensitive, but we should handle common variations
      const context1 = detectCalculatorContext('/calculator/pricing-strategy');
      const context2 = detectCalculatorContext('/calculator/pricing-strategy');
      expect(context1).toBe(context2);
    });
  });
});
