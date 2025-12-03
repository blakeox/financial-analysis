import { describe, expect, it } from 'vitest';
import { InvestmentPortfolioTool } from '../tools/investment-portfolio';

describe('InvestmentPortfolioTool', () => {
  // The Zod schema expects this structure (not the MCP inputSchema structure)
  const validInput = {
    personalInfo: {
      age: 35,
      maritalStatus: 'married' as const,
      dependents: 2,
      employmentStatus: 'employed' as const,
    },
    currentPortfolio: {
      totalValue: 250000,
      holdings: [
        {
          symbol: 'VTI',
          name: 'Vanguard Total Stock Market',
          shares: 500,
          currentPrice: 250,
          sector: 'diversified',
          assetClass: 'etf' as const,
        },
        {
          symbol: 'BND',
          name: 'Vanguard Total Bond Market',
          shares: 200,
          currentPrice: 75,
          sector: 'fixed-income',
          assetClass: 'etf' as const,
        },
      ],
      cashReserve: 25000,
    },
    goals: {
      targetAllocation: {
        stocks: 0.7,
        bonds: 0.2,
        cash: 0.1,
        alternatives: 0,
      },
      riskTolerance: 'moderate' as const,
      timeHorizon: 25,
      rebalancingFrequency: 'quarterly' as const,
    },
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(InvestmentPortfolioTool.toolName).toBe('analyze_investment_portfolio');
    });

    it('has a description', () => {
      expect(InvestmentPortfolioTool.description).toBeTruthy();
      expect(InvestmentPortfolioTool.description.length).toBeGreaterThan(50);
    });

    it('has required input schema fields', () => {
      const schema = InvestmentPortfolioTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      // NOTE: The MCP inputSchema defines portfolio/holdings/targetAllocation
      // but the Zod schema expects personalInfo/currentPortfolio/goals
      // This is a known schema mismatch that should be addressed
      expect(schema.required).toContain('portfolio');
      expect(schema.required).toContain('holdings');
      expect(schema.required).toContain('targetAllocation');
    });
  });

  describe('execute', () => {
    it('performs portfolio analysis with valid input', async () => {
      const result = (await InvestmentPortfolioTool.execute(validInput)) as {
        success: boolean;
        data?: unknown;
        error?: string;
      };

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('returns portfolio recommendations', async () => {
      const result = (await InvestmentPortfolioTool.execute(validInput)) as {
        success: boolean;
        data?: {
          recommendations?: string[];
        };
      };

      expect(result.success).toBe(true);
      expect(result.data?.recommendations).toBeDefined();
    });

    it('includes metadata in response', async () => {
      const result = (await InvestmentPortfolioTool.execute(validInput)) as {
        success: boolean;
        metadata?: { tool?: string; timestamp?: string };
      };

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.tool).toBe('analyze_investment_portfolio');
      expect(result.metadata?.timestamp).toBeDefined();
    });

    it('returns error for invalid input - missing required fields', async () => {
      const invalidInput = {
        personalInfo: {
          age: 35,
          // Missing other required fields
        },
      };

      const result = (await InvestmentPortfolioTool.execute(invalidInput)) as {
        success: boolean;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns error for invalid input - age out of range', async () => {
      const invalidInput = {
        ...validInput,
        personalInfo: {
          ...validInput.personalInfo,
          age: 10, // Too young
        },
      };

      const result = (await InvestmentPortfolioTool.execute(invalidInput)) as {
        success: boolean;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
