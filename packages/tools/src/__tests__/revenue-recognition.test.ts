import { describe, expect, it } from 'vitest';
import { RevenueRecognitionTool } from '../tools/revenue-recognition';

describe('RevenueRecognitionTool', () => {
  const validInput = {
    companyInfo: {
      industry: 'software',
      revenueModel: 'subscription',
      accountingStandard: 'asc-606',
    },
    contracts: [
      {
        contractId: 'C-1',
        contractValue: 120000,
        contractStartDate: '2025-01-01',
        contractEndDate: '2025-12-31',
        performanceObligations: [
          {
            obligationId: 'setup',
            standaloneSellingPrice: 20000,
            fulfillmentMethod: 'point-in-time',
          },
          {
            obligationId: 'service',
            standaloneSellingPrice: 100000,
            fulfillmentMethod: 'over-time',
          },
        ],
        paymentTerms: {
          upfrontPayment: 20000,
          milestonePayments: [],
        },
      },
    ],
    analysis: {
      includeRevenueSchedule: true,
      includeDeferredRevenue: true,
      includeContractAssetAnalysis: true,
      includeComplianceCheck: true,
      projectionPeriod: 3,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(RevenueRecognitionTool.toolName).toBe('analyze_revenue_recognition');
    expect(RevenueRecognitionTool.inputSchema.required).toEqual(['contracts']);
  });

  it('calculates recognized revenue and compliance status', async () => {
    const result = (await RevenueRecognitionTool.execute(validInput)) as {
      summary: {
        totalContractValue: number;
        totalRevenueRecognized: number;
        totalDeferredRevenue: number;
        complianceStatus: string;
      };
    };

    expect(result.summary.totalContractValue).toBeCloseTo(120000, 6);
    expect(result.summary.totalRevenueRecognized).toBeCloseTo(120000, 6);
    expect(result.summary.totalDeferredRevenue).toBeCloseTo(0, 6);
    expect(result.summary.complianceStatus).toBe('compliant');
  });

  it('rejects invalid input', async () => {
    await expect(
      RevenueRecognitionTool.execute({
        ...validInput,
        contracts: [
          {
            ...validInput.contracts[0],
            contractValue: -1,
          },
        ],
      })
    ).rejects.toThrow();
  });
});
