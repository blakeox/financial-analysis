import { describe, expect, it } from 'vitest';
import { MAAnalysisTool } from '../tools/ma-analysis';

describe('MAAnalysisTool', () => {
  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(MAAnalysisTool.toolName).toBe('analyze_ma_deal');
    });

    it('has a description', () => {
      expect(MAAnalysisTool.description).toBeTruthy();
      expect(MAAnalysisTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = MAAnalysisTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('transaction');
      expect(schema.required).toContain('acquirer');
      expect(schema.required).toContain('target');
      expect(schema.required).toContain('transactionTerms');
      expect(schema.required).toContain('synergies');
      expect(schema.required).toContain('integration');
      expect(schema.required).toContain('analysis');
    });
  });

  describe('execute', () => {
    const baseInput = {
      transaction: {
        type: 'acquisition' as const,
        structure: 'cash' as const,
        announcementDate: '2024-01-15',
        expectedClosingDate: '2024-06-30',
        status: 'announced' as const,
      },
      acquirer: {
        name: 'Mega Corp',
        ticker: 'MEGA',
        marketCap: 50000000000,
        enterpriseValue: 55000000000,
        sharesOutstanding: 1000000000,
        currentPrice: 50,
        revenue: 20000000000,
        ebitda: 4000000000,
        netIncome: 2000000000,
        totalDebt: 10000000000,
        cashAndEquivalents: 5000000000,
        beta: 1.1,
        creditRating: 'A',
      },
      target: {
        name: 'Small Tech Inc',
        ticker: 'STI',
        marketCap: 5000000000,
        enterpriseValue: 5500000000,
        sharesOutstanding: 100000000,
        currentPrice: 50,
        revenue: 2000000000,
        ebitda: 400000000,
        netIncome: 200000000,
        totalDebt: 700000000,
        cashAndEquivalents: 200000000,
        beta: 1.3,
        creditRating: 'BBB',
      },
      transactionTerms: {
        purchasePrice: 7500000000,
        cashConsideration: 5000000000,
        stockConsideration: 2500000000,
        exchangeRatio: 1.0,
        premium: 0.5,
        financing: {
          newDebt: 4000000000,
          cashOnHand: 3000000000,
          equityIssuance: 500000000,
          otherSources: 0,
        },
      },
      synergies: {
        costSynergies: {
          annualAmount: 300000000,
          realizationPeriod: 3,
          probability: 0.8,
          categories: [
            { name: 'Headcount reduction', amount: 150000000, timing: 2 },
            { name: 'Procurement savings', amount: 100000000, timing: 1 },
            { name: 'IT consolidation', amount: 50000000, timing: 3 },
          ],
        },
        revenueSynergies: {
          annualAmount: 200000000,
          realizationPeriod: 4,
          probability: 0.6,
          categories: [
            { name: 'Cross-selling', amount: 120000000, timing: 3 },
            { name: 'Market expansion', amount: 80000000, timing: 4 },
          ],
        },
        taxSynergies: {
          annualAmount: 50000000,
          realizationPeriod: 2,
          probability: 0.7,
        },
      },
      integration: {
        timeline: 2,
        costs: {
          oneTimeCosts: 200000000,
          annualCosts: 50000000,
          duration: 2,
        },
        risks: [
          {
            category: 'Cultural',
            description: 'Cultural integration challenges',
            probability: 0.4,
            impact: 'medium' as const,
            mitigation: 'Cross-company integration teams',
          },
          {
            category: 'Technology',
            description: 'IT systems integration',
            probability: 0.3,
            impact: 'high' as const,
            mitigation: 'Phased integration approach',
          },
        ],
      },
      analysis: {
        discountRate: 0.1,
        taxRate: 0.25,
        terminalGrowthRate: 0.025,
        includeAccretionDilution: true,
        includeSensitivity: true,
        includeScenarios: true,
        forecastPeriod: 5,
      },
    };

    it('performs basic M&A analysis', async () => {
      const result = await MAAnalysisTool.execute(baseInput);

      expect(result).toBeDefined();
    });

    it('handles different transaction types', async () => {
      const mergerResult = await MAAnalysisTool.execute({
        ...baseInput,
        transaction: {
          ...baseInput.transaction,
          type: 'merger' as const,
        },
      });

      const divestitureResult = await MAAnalysisTool.execute({
        ...baseInput,
        transaction: {
          ...baseInput.transaction,
          type: 'divestiture' as const,
        },
      });

      expect(mergerResult).toBeDefined();
      expect(divestitureResult).toBeDefined();
    });

    it('handles different transaction structures', async () => {
      const stockResult = await MAAnalysisTool.execute({
        ...baseInput,
        transaction: {
          ...baseInput.transaction,
          structure: 'stock' as const,
        },
      });

      const mixedResult = await MAAnalysisTool.execute({
        ...baseInput,
        transaction: {
          ...baseInput.transaction,
          structure: 'mixed' as const,
        },
      });

      expect(stockResult).toBeDefined();
      expect(mixedResult).toBeDefined();
    });

    it('handles different transaction statuses', async () => {
      const pendingResult = await MAAnalysisTool.execute({
        ...baseInput,
        transaction: {
          ...baseInput.transaction,
          status: 'pending' as const,
        },
      });

      const completedResult = await MAAnalysisTool.execute({
        ...baseInput,
        transaction: {
          ...baseInput.transaction,
          status: 'completed' as const,
        },
      });

      expect(pendingResult).toBeDefined();
      expect(completedResult).toBeDefined();
    });

    it('handles analysis without optional features', async () => {
      const result = await MAAnalysisTool.execute({
        ...baseInput,
        analysis: {
          discountRate: 0.1,
          taxRate: 0.25,
          terminalGrowthRate: 0.025,
          includeAccretionDilution: false,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      expect(result).toBeDefined();
    });

    it('handles high synergy scenarios', async () => {
      const result = await MAAnalysisTool.execute({
        ...baseInput,
        synergies: {
          ...baseInput.synergies,
          costSynergies: {
            ...baseInput.synergies.costSynergies,
            annualAmount: 500000000,
            probability: 0.9,
          },
          revenueSynergies: {
            ...baseInput.synergies.revenueSynergies,
            annualAmount: 400000000,
            probability: 0.7,
          },
        },
      });

      expect(result).toBeDefined();
    });

    it('handles different integration timelines', async () => {
      const shortTimeline = await MAAnalysisTool.execute({
        ...baseInput,
        integration: {
          ...baseInput.integration,
          timeline: 1,
        },
      });

      const longTimeline = await MAAnalysisTool.execute({
        ...baseInput,
        integration: {
          ...baseInput.integration,
          timeline: 5,
        },
      });

      expect(shortTimeline).toBeDefined();
      expect(longTimeline).toBeDefined();
    });

    it('returns error for invalid input', async () => {
      await expect(
        MAAnalysisTool.execute({
          // Missing required fields
        })
      ).rejects.toThrow();
    });
  });
});
