import { describe, expect, it } from 'vitest';
import { InvestmentPortfolioAnalyzer } from '../investment-portfolio.js';
import type { InvestmentPortfolioInput } from '../../../schemas/investment-portfolio.js';

const baseInput: InvestmentPortfolioInput = {
  personalInfo: {
    age: 35,
    maritalStatus: 'single',
    dependents: 0,
    employmentStatus: 'employed',
  },
  currentPortfolio: {
    totalValue: 100000,
    holdings: [
      {
        symbol: 'AAPL',
        name: 'Apple Inc',
        shares: 100,
        currentPrice: 150,
        sector: 'Technology',
        assetClass: 'stock',
      },
    ],
    cashReserve: 85000,
  },
  goals: {
    targetAllocation: {
      stocks: 0.6,
      bonds: 0.3,
      cash: 0.1,
      alternatives: 0,
    },
    riskTolerance: 'moderate',
    timeHorizon: 20,
    rebalancingFrequency: 'quarterly',
  },
};

describe('InvestmentPortfolioAnalyzer', () => {
  describe('analyze', () => {
    it('should return portfolio analysis', () => {
      const result = InvestmentPortfolioAnalyzer.analyze(baseInput) as any;

      expect(result.summary).toBeDefined();
      expect(result.summary.currentValue).toBe('100000.00');
      expect(result.rebalancingRecommendations).toBeDefined();
      expect(result.diversificationAnalysis).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.insights).toBeInstanceOf(Array);
    });

    it('should calculate current allocation correctly', () => {
      const result = InvestmentPortfolioAnalyzer.analyze(baseInput) as any;

      expect(result.summary.actualAllocation.stocks).toBe('15.0'); // 15000 / 100000
      expect(result.summary.actualAllocation.cash).toBe('85.0'); // 85000 / 100000
    });

    it('should calculate target allocation correctly', () => {
      const result = InvestmentPortfolioAnalyzer.analyze(baseInput) as any;

      expect(result.summary.targetAllocation.stocks).toBe('60.0');
      expect(result.summary.targetAllocation.bonds).toBe('30.0');
      expect(result.summary.targetAllocation.cash).toBe('10.0');
      expect(result.summary.targetAllocation.alternatives).toBe('0.0');
    });

    it('should calculate allocation drift', () => {
      const result = InvestmentPortfolioAnalyzer.analyze(baseInput) as any;

      // Drift = |0.15 - 0.6| + |0 - 0.3| + |0.85 - 0.1| + |0 - 0| = 0.45 + 0.3 + 0.75 + 0 = 1.5 (150%)
      expect(parseFloat(result.summary.allocationDrift)).toBeGreaterThan(100);
    });

    it('should generate rebalancing recommendations for large drifts', () => {
      const result = InvestmentPortfolioAnalyzer.analyze(baseInput) as any;

      expect(result.rebalancingRecommendations.length).toBeGreaterThan(0);
      
      // Should recommend increasing stocks (from 15% to 60%)
      const stocksRec = result.rebalancingRecommendations.find((r: any) => r.assetClass === 'stocks');
      expect(stocksRec).toBeDefined();
      expect(stocksRec.action).toBe('Increase');
      expect(stocksRec.currentPercent).toBe('15.0');
      expect(stocksRec.targetPercent).toBe('60.0');

      // Should recommend decreasing cash (from 85% to 10%)
      const cashRec = result.rebalancingRecommendations.find((r: any) => r.assetClass === 'cash');
      expect(cashRec).toBeDefined();
      expect(cashRec.action).toBe('Decrease');
    });

    it('should not generate rebalancing recommendations for small drifts (<5%)', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 380,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'AGG',
              name: 'Bond ETF',
              shares: 300,
              currentPrice: 100,
              sector: 'Fixed Income',
              assetClass: 'bond',
            },
          ],
          cashReserve: 10000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      // Current: stocks 57%, bonds 30%, cash 10%, alternatives 0%
      // Target: stocks 60%, bonds 30%, cash 10%, alternatives 0%
      // All drifts are <= 5%
      expect(result.rebalancingRecommendations.length).toBe(0);
    });

    it('should calculate portfolio score based on drift', () => {
      const perfectInput: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 400,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'AGG',
              name: 'Bond ETF',
              shares: 300,
              currentPrice: 100,
              sector: 'Fixed Income',
              assetClass: 'bond',
            },
          ],
          cashReserve: 10000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(perfectInput) as any;

      // Current: stocks 60%, bonds 30%, cash 10%, alternatives 0% = perfect match
      expect(result.summary.portfolioScore).toBeGreaterThan(95);
    });

    it('should give bonus for drift < 5%', () => {
      const goodInput: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 380,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'AGG',
              name: 'Bond ETF',
              shares: 300,
              currentPrice: 100,
              sector: 'Fixed Income',
              assetClass: 'bond',
            },
          ],
          cashReserve: 10000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(goodInput) as any;

      // Small drift should result in high score with bonuses
      expect(result.summary.portfolioScore).toBeGreaterThan(90);
    });

    it('should calculate low score for large drift', () => {
      const result = InvestmentPortfolioAnalyzer.analyze(baseInput) as any;

      // Large drift (150%) should result in low score
      expect(result.summary.portfolioScore).toBeLessThan(50);
    });

    it('should analyze diversification across sectors', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 100,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'JPM',
              name: 'JP Morgan',
              shares: 50,
              currentPrice: 150,
              sector: 'Finance',
              assetClass: 'stock',
            },
            {
              symbol: 'JNJ',
              name: 'Johnson & Johnson',
              shares: 50,
              currentPrice: 150,
              sector: 'Healthcare',
              assetClass: 'stock',
            },
          ],
          cashReserve: 62500,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      expect(result.diversificationAnalysis.sectors).toHaveLength(3);
      expect(result.diversificationAnalysis.sectors).toContain('Technology');
      expect(result.diversificationAnalysis.sectors).toContain('Finance');
      expect(result.diversificationAnalysis.sectors).toContain('Healthcare');
    });

    it('should calculate sector concentration', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 100,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'GOOGL',
              name: 'Alphabet Inc',
              shares: 50,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'JPM',
              name: 'JP Morgan',
              shares: 50,
              currentPrice: 150,
              sector: 'Finance',
              assetClass: 'stock',
            },
          ],
          cashReserve: 62500,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      // 2 out of 3 holdings in Technology sector = 0.667 concentration
      expect(result.diversificationAnalysis.sectorConcentration).toBeCloseTo(0.667, 2);
    });

    it('should calculate asset class diversity', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 100,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'AGG',
              name: 'Bond ETF',
              shares: 100,
              currentPrice: 100,
              sector: 'Fixed Income',
              assetClass: 'bond',
            },
            {
              symbol: 'VTI',
              name: 'Total Market ETF',
              shares: 100,
              currentPrice: 200,
              sector: 'Diversified',
              assetClass: 'etf',
            },
          ],
          cashReserve: 45000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      // 3 asset classes out of 6 possible = 0.5 diversity
      expect(result.diversificationAnalysis.assetClassDiversity).toBeCloseTo(0.5, 2);
    });

    it('should recommend rebalancing for drift > 10%', () => {
      const result = InvestmentPortfolioAnalyzer.analyze(baseInput) as any;

      expect(result.recommendations).toContain('Rebalance your portfolio to align with target allocation');
    });

    it('should recommend diversification for sector concentration > 40%', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 100,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'GOOGL',
              name: 'Alphabet Inc',
              shares: 50,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'MSFT',
              name: 'Microsoft',
              shares: 50,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
          ],
          cashReserve: 55000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      // All holdings in Technology = 1.0 concentration (> 0.4)
      expect(result.recommendations).toContain('Diversify across more sectors to reduce concentration risk');
    });

    it('should recommend investing excess cash', () => {
      const result = InvestmentPortfolioAnalyzer.analyze(baseInput) as any;

      // Cash is 85% vs target of 10% (8.5x target)
      expect(result.recommendations).toContain('Consider investing excess cash to meet target allocation');
    });

    it('should recommend increasing stocks when < 80% of target', () => {
      const result = InvestmentPortfolioAnalyzer.analyze(baseInput) as any;

      // Stocks are 15% vs target of 60% (0.25x target < 0.8)
      expect(result.recommendations).toContain('Increase stock allocation to meet target for your risk tolerance');
    });

    it('should not recommend increasing stocks when >= 80% of target', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 320,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
          ],
          cashReserve: 52000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      // Stocks are 48% vs target of 60% (0.8x target = 80%)
      expect(result.recommendations).not.toContain('Increase stock allocation to meet target for your risk tolerance');
    });

    it('should handle portfolio with bonds', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AGG',
              name: 'Bond ETF',
              shares: 300,
              currentPrice: 100,
              sector: 'Fixed Income',
              assetClass: 'bond',
            },
          ],
          cashReserve: 70000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      expect(result.summary.actualAllocation.bonds).toBe('30.0');
      expect(result.summary.actualAllocation.stocks).toBe('0.0');
    });

    it('should handle portfolio with alternatives', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'GLD',
              name: 'Gold ETF',
              shares: 200,
              currentPrice: 150,
              sector: 'Commodities',
              assetClass: 'alternative',
            },
          ],
          cashReserve: 70000,
        },
        goals: {
          ...baseInput.goals,
          targetAllocation: {
            stocks: 0.5,
            bonds: 0.3,
            cash: 0.1,
            alternatives: 0.1,
          },
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      expect(result.summary.actualAllocation.alternatives).toBe('30.0');
    });

    it('should handle ETF as stock allocation', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'VTI',
              name: 'Total Market ETF',
              shares: 300,
              currentPrice: 200,
              sector: 'Diversified',
              assetClass: 'etf',
            },
          ],
          cashReserve: 40000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      // ETFs are counted as stocks
      expect(result.summary.actualAllocation.stocks).toBe('60.0');
    });

    it('should generate insights based on portfolio score', () => {
      const perfectInput: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 400,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'AGG',
              name: 'Bond ETF',
              shares: 300,
              currentPrice: 100,
              sector: 'Fixed Income',
              assetClass: 'bond',
            },
          ],
          cashReserve: 10000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(perfectInput) as any;

      expect(result.insights[0]).toContain('well aligned');
      expect(result.insights[3]).toBe('Your portfolio is well-balanced and aligned with your goals');
    });

    it('should generate insights for moderately aligned portfolio', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 340,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'AGG',
              name: 'Bond ETF',
              shares: 200,
              currentPrice: 100,
              sector: 'Fixed Income',
              assetClass: 'bond',
            },
          ],
          cashReserve: 29000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      // Current: stocks 51%, bonds 20%, cash 29%, alternatives 0%
      // Target: stocks 60%, bonds 30%, cash 10%, alternatives 0%
      // Drift = 9% + 10% + 19% + 0% = 38% (moderate)
      expect(result.insights[0]).toContain('poorly aligned');
    });

    it('should generate insights for poorly aligned portfolio', () => {
      const result = InvestmentPortfolioAnalyzer.analyze(baseInput) as any;

      expect(result.insights[0]).toContain('poorly aligned');
      expect(result.insights[3]).toBe('Consider rebalancing to optimize your portfolio');
    });

    it('should include holdings count in insights', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 100,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
            {
              symbol: 'JPM',
              name: 'JP Morgan',
              shares: 50,
              currentPrice: 150,
              sector: 'Finance',
              assetClass: 'stock',
            },
            {
              symbol: 'JNJ',
              name: 'Johnson & Johnson',
              shares: 50,
              currentPrice: 150,
              sector: 'Healthcare',
              assetClass: 'stock',
            },
          ],
          cashReserve: 62500,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      expect(result.insights[2]).toContain('3 positions across 3 sectors');
    });

    it('should handle zero cash reserve', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'AAPL',
              name: 'Apple Inc',
              shares: 667,
              currentPrice: 150,
              sector: 'Technology',
              assetClass: 'stock',
            },
          ],
          cashReserve: 0,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      expect(result.summary.actualAllocation.cash).toBe('0.0');
    });

    it('should handle empty holdings array', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [],
          cashReserve: 100000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      expect(result.summary.actualAllocation.stocks).toBe('0.0');
      expect(result.summary.actualAllocation.bonds).toBe('0.0');
      expect(result.summary.actualAllocation.cash).toBe('100.0');
      expect(result.diversificationAnalysis.sectors).toHaveLength(0);
    });

    it('should handle mutual-fund and cash asset classes', () => {
      const input: InvestmentPortfolioInput = {
        ...baseInput,
        currentPortfolio: {
          totalValue: 100000,
          holdings: [
            {
              symbol: 'VFINX',
              name: 'Vanguard 500',
              shares: 100,
              currentPrice: 300,
              sector: 'Diversified',
              assetClass: 'mutual-fund',
            },
            {
              symbol: 'CASH',
              name: 'Cash Equivalent',
              shares: 1,
              currentPrice: 20000,
              sector: 'Cash',
              assetClass: 'cash',
            },
          ],
          cashReserve: 50000,
        },
      };

      const result = InvestmentPortfolioAnalyzer.analyze(input) as any;

      // mutual-fund and cash holdings don't contribute to stocks/bonds/alternatives
      // Only cashReserve contributes to cash allocation
      expect(result.summary.actualAllocation.stocks).toBe('0.0');
      expect(result.summary.actualAllocation.bonds).toBe('0.0');
      expect(result.summary.actualAllocation.cash).toBe('50.0');
    });
  });
});
