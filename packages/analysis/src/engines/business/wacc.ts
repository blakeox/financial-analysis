import { Decimal } from 'decimal.js';
import { z } from 'zod';

export interface WACCResult {
  wacc: number;
  equityWeight: number;
  debtWeight: number;
  costOfEquity: number;
  costOfDebt: number;
  taxRate: number;
  afterTaxCostOfDebt: number;
}

export const WACCInputSchema = z.object({
  equityValue: z.number().positive('Equity value must be positive'),
  debtValue: z.number().positive('Debt value must be positive'),
  costOfEquity: z.number().min(0).max(1, 'Cost of equity must be between 0 and 1'),
  costOfDebt: z.number().min(0).max(1, 'Cost of debt must be between 0 and 1'),
  taxRate: z.number().min(0).max(1, 'Tax rate must be between 0 and 1'),
});

export type WACCInput = z.infer<typeof WACCInputSchema>;

export class WACCAnalyzer {
  static analyze(input: WACCInput): WACCResult {
    const { equityValue, debtValue, costOfEquity, costOfDebt, taxRate } = input;

    const totalValue = new Decimal(equityValue).plus(debtValue);
    const equityWeight = new Decimal(equityValue).div(totalValue).toNumber();
    const debtWeight = new Decimal(debtValue).div(totalValue).toNumber();

    const afterTaxCostOfDebt = new Decimal(costOfDebt)
      .times(new Decimal(1).minus(taxRate))
      .toNumber();

    const equityComponent = new Decimal(equityWeight).times(costOfEquity);
    const debtComponent = new Decimal(debtWeight).times(afterTaxCostOfDebt);

    const wacc = equityComponent.plus(debtComponent).toNumber();

    return {
      wacc,
      equityWeight,
      debtWeight,
      costOfEquity,
      costOfDebt,
      taxRate,
      afterTaxCostOfDebt,
    };
  }
}
