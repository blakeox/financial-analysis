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

  it('should recognize point-in-time revenue only in year one', () => {
    const result = RevenueRecognitionCalculator.analyze({
      ...baseInput,
      contracts: [
        {
          ...baseInput.contracts[0],
          contractValue: 150000,
          performanceObligations: [
            {
              obligationId: 'OBL-OT',
              standaloneSellingPrice: 100000,
              fulfillmentMethod: 'over-time',
            },
            {
              obligationId: 'OBL-PIT',
              standaloneSellingPrice: 50000,
              fulfillmentMethod: 'point-in-time',
            },
          ],
        },
      ],
      analysis: {
        ...baseInput.analysis,
        projectionPeriod: 2,
      },
    }) as any;

    expect(result.revenueSchedule.schedule[0].revenue).toBe(100000);
    expect(result.revenueSchedule.schedule[1].revenue).toBe(50000);
  });

  it('should flag non-compliant contracts when issues exceed two', () => {
    const result = RevenueRecognitionCalculator.analyze({
      ...baseInput,
      contracts: [
        {
          ...baseInput.contracts[0],
          contractId: 'EMPTY-OBL',
          performanceObligations: [],
        },
        {
          ...baseInput.contracts[0],
          contractId: 'ZERO-PRICE',
          performanceObligations: [
            {
              obligationId: 'OBL-ZERO',
              standaloneSellingPrice: 0,
              fulfillmentMethod: 'over-time',
            },
          ],
        },
      ],
    }) as any;

    expect(result.complianceCheck.status).toBe('non-compliant');
  });

  it('should allocate evenly when standalone prices are zero', () => {
    const result = RevenueRecognitionCalculator.analyze({
      ...baseInput,
      contracts: [
        {
          ...baseInput.contracts[0],
          contractValue: 100000,
          performanceObligations: [
            {
              obligationId: 'OBL-A',
              standaloneSellingPrice: 0,
              fulfillmentMethod: 'over-time',
            },
            {
              obligationId: 'OBL-B',
              standaloneSellingPrice: 0,
              fulfillmentMethod: 'over-time',
            },
          ],
        },
      ],
      analysis: {
        includeRevenueSchedule: false,
        includeDeferredRevenue: true,
        includeContractAssetAnalysis: true,
        includeComplianceCheck: false,
        projectionPeriod: 3,
      },
    }) as any;

    expect(result.contractAllocation[0].obligations[0].allocatedValue).toBe(50000);
    expect(result.contractAllocation[0].obligations[1].allocatedValue).toBe(50000);
    expect(result.deferredRevenue.totalDeferred).toBe(100000);
    expect(result.contractAssets.totalContractAssets).toBe(30000);
  });

  it('should skip deferred revenue and contract assets when disabled', () => {
    const result = RevenueRecognitionCalculator.analyze({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        includeDeferredRevenue: false,
        includeContractAssetAnalysis: false,
      },
    }) as any;

    expect(result.deferredRevenue).toBeUndefined();
    expect(result.contractAssets).toBeUndefined();
  });

  it('should mark review-needed when a single issue exists', () => {
    const result = RevenueRecognitionCalculator.analyze({
      ...baseInput,
      contracts: [
        {
          ...baseInput.contracts[0],
          contractId: 'SINGLE-ISSUE',
          performanceObligations: [
            {
              obligationId: 'OBL-ZERO',
              standaloneSellingPrice: 0,
              fulfillmentMethod: 'over-time',
            },
          ],
        },
      ],
    }) as any;

    expect(result.complianceCheck.status).toBe('review-needed');
    expect(result.recommendations).toContain('Review revenue recognition for compliance issues');
  });
});
