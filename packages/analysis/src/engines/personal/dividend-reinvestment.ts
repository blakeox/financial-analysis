import { Decimal } from 'decimal.js';

import type { DividendReinvestmentInput } from '../../schemas/dividend-reinvestment.js';

export interface DividendReinvestmentResult {
  endingValue: number;
  endingShares: number;
  totalContributions: number;
  totalDividends: number;
  cagr: number | null;
  assumptions: {
    initialInvestment: number;
    sharePrice: number;
    years: number;
    annualDividendYield: number;
    dividendFrequency: 'monthly' | 'quarterly' | 'annual';
    sharePriceGrowthRate: number;
    dividendGrowthRate: number;
    annualContribution: number;
  };
}

function periodsPerYear(frequency: DividendReinvestmentInput['dividendFrequency']): number {
  switch (frequency) {
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    case 'annual':
      return 1;
  }
}

export class DividendReinvestmentCalculator {
  static analyze(input: DividendReinvestmentInput): DividendReinvestmentResult {
    const ppy = periodsPerYear(input.dividendFrequency);
    const totalPeriods = Math.round(input.years * ppy);
    const priceGrowthPerPeriod = Math.pow(1 + input.sharePriceGrowthRate, 1 / ppy) - 1;
    const dividendGrowthPerPeriod = Math.pow(1 + input.dividendGrowthRate, 1 / ppy) - 1;

    let sharePrice = input.sharePrice;
    let annualDividendPerShare = new Decimal(input.annualDividendYield).times(sharePrice).toNumber();

    let shares =
      input.sharePrice > 0 ? new Decimal(input.initialInvestment).div(input.sharePrice).toNumber() : 0;
    let totalContributions = input.initialInvestment;
    let totalDividends = 0;

    const contributionPerPeriod = input.annualContribution / ppy;

    for (let period = 1; period <= totalPeriods; period++) {
      if (contributionPerPeriod > 0) {
        const additionalShares = new Decimal(contributionPerPeriod).div(sharePrice).toNumber();
        shares += additionalShares;
        totalContributions += contributionPerPeriod;
      }

      const dividendPerPeriodPerShare = annualDividendPerShare / ppy;
      const dividendCash = dividendPerPeriodPerShare * shares;
      totalDividends += dividendCash;

      const reinvestShares = sharePrice > 0 ? dividendCash / sharePrice : 0;
      shares += reinvestShares;

      sharePrice = sharePrice * (1 + priceGrowthPerPeriod);
      annualDividendPerShare = annualDividendPerShare * (1 + dividendGrowthPerPeriod);
    }

    const endingValue = shares * sharePrice;
    const cagr =
      totalContributions > 0
        ? Math.pow(endingValue / totalContributions, 1 / input.years) - 1
        : null;

    return {
      endingValue,
      endingShares: shares,
      totalContributions,
      totalDividends,
      cagr,
      assumptions: {
        initialInvestment: input.initialInvestment,
        sharePrice: input.sharePrice,
        years: input.years,
        annualDividendYield: input.annualDividendYield,
        dividendFrequency: input.dividendFrequency,
        sharePriceGrowthRate: input.sharePriceGrowthRate,
        dividendGrowthRate: input.dividendGrowthRate,
        annualContribution: input.annualContribution,
      },
    };
  }
}

