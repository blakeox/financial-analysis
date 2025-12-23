/**
 * Revenue Recognition Tests
 */

import { describe, expect, it } from 'vitest';
import type { RevenueRecognitionInput } from '../../../schemas/revenue-recognition.js';
import { RevenueRecognitionCalculator } from '../revenue-recognition.js';

describe('RevenueRecognitionCalculator', () => {
  const baseInput: RevenueRecognitionInput = {
    companyInfo: {
      industry: 'Software',
      revenueModel: 'subscription',
      accountingStandard: 'asc-606',
    },
    contracts: [
      {
        contractId: 'CONTRACT001',
        contractValue: 120000,
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        performanceObligations: [
          {
            obligationId: 'OBL001',
            standaloneSellingPrice: 120000,
            fulfillmentMethod: 'over-time',
          },
        ],
        paymentTerms: {
          upfrontPayment: 0,
          milestonePayments: [],
        },
      },
    ],
    analysis: {
      includeRevenueSchedule: true,
      includeDeferredRevenue: true,
      includeContractAssetAnalysis: true,
      includeComplianceCheck: true,
      projectionPeriod: 5,
    },
  };

  it('should calculate revenue recognition', () => {
    const result = RevenueRecognitionCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should generate revenue schedule when requested', () => {
    const result = RevenueRecognitionCalculator.analyze(baseInput) as any;
    expect(result.revenueSchedule).toBeDefined();
    expect(Array.isArray(result.revenueSchedule.schedule)).toBe(true);
  });

  it('should calculate deferred revenue', () => {
    const result = RevenueRecognitionCalculator.analyze(baseInput) as any;
    expect(result.deferredRevenue).toBeDefined();
  });

  it('should analyze contract assets', () => {
    const result = RevenueRecognitionCalculator.analyze(baseInput) as any;
    expect(result.contractAssets).toBeDefined();
  });

  it('should perform compliance check', () => {
    const result = RevenueRecognitionCalculator.analyze(baseInput);
    expect(result.complianceCheck).toBeDefined();
  });
});

