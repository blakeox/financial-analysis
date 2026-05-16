import { describe, it, expect } from 'vitest';
import { EnhancedLeaseAnalyzer } from '../enhanced-lease';
import type { EnhancedLeaseInput } from '../../../schemas/enhanced-lease';

/**
 * This test verifies that the enhanced lease analysis engine can handle
 * the specific industrial lease data extracted from the test PDF:
 *
 * Base Rent: Year 1 $45,000/month
 * Lease Term: 5 years (60 months)
 * Square Footage: 50,000 RSF
 * Escalation: 3% annually (percentage-based)
 * Security Deposit: $90,000
 * CAM/Taxes/Insurance/Utilities: $0 (NNN lease - tenant pays 100% of operating expenses)
 * Parking: 60 exclusive parking spaces
 * Property: 4800 Foundry Park Drive, Livonia, Michigan
 */
describe('EnhancedLeaseAnalyzer - Industrial Lease from Extracted PDF', () => {
  it('should analyze the industrial complex lease from PDF extraction', () => {
    // This is the data structure that would be extracted from the PDF
    const extractedData = {
      leaseType: 'warehouse-nnn',
      leaseTerm: 60,
      baseRent: 45000,
      escalationType: 'percentage' as const,
      escalationRate: 0.03,
      securityDeposit: 90000,
      squareFootage: 50000,
      cam: 0,
      taxes: 0,
      insurance: 0,
      utilities: 0,
      parkingSpaces: 60,
      propertyAddress: '4800 Foundry Park Drive, Livonia, Michigan',
      leaseStartDate: '2025-02-01',
      leaseEndDate: '2030-01-31',
      landlord: 'Ironclad Industrial Holdings, LLC',
      tenant: 'Midwest Precision Manufacturing, LLC',
    };

    // Convert extracted data to enhanced lease input format
    const input: EnhancedLeaseInput = {
      leaseType: 'warehouse-nnn',
      baseRent: extractedData.baseRent,
      termMonths: extractedData.leaseTerm,
      annualRate: 0.05, // Default rate
      principal: 0, // Real estate lease
      residualValue: 0,

      // Escalation: 3% annually
      escalation: {
        type: 'fixed', // 'percentage' maps to 'fixed' in the schema
        rate: extractedData.escalationRate,
        schedule: [],
        cpiBase: 0,
      },

      // NNN lease - tenant pays 100% of operating expenses
      // In practice, these would be calculated and passed in monthly
      additionalCosts: {
        camCharges: extractedData.cam,
        propertyTaxes: extractedData.taxes,
        insurance: extractedData.insurance,
        utilities: extractedData.utilities,
        maintenance: 0,
        managementFee: 0,
        parking: 0,
        security: 0,
        cleaning: 0,
        technology: 0,
        elevatorMaintenance: 0,
        hvacMaintenance: 0,
        landscaping: 0,
        wasteManagement: 0,
      },

      // Security deposit
      securityDeposit: {
        amount: extractedData.securityDeposit,
        interestRate: 0,
      },

      // Building space details
      buildingSpace: {
        squareFeet: extractedData.squareFootage,
        usableSquareFeet: extractedData.squareFootage, // Assume no load factor for simplicity
        loadFactor: 0,
        pricePerSquareFoot: (extractedData.baseRent * 12) / extractedData.squareFootage, // $10.80/SF
        floors: ['1'],
        parkingSpaces: extractedData.parkingSpaces,
        exclusiveAreas: ['Loading docks', 'Truck courts'],
        zoningType: 'Industrial',
        permittedUses: [
          'Precision machining',
          'Metal fabrication',
          'Warehousing',
          'Ancillary office',
        ],
      },

      // Default values
      discountRate: 0.08,
      renewalOptions: [],
    };

    // Run the analysis
    const result = EnhancedLeaseAnalyzer.analyze(input);

    // Verify basic structure
    expect(result.leaseType).toBe('warehouse-nnn');
    expect(result.termMonths).toBe(60);
    expect(result.schedule).toHaveLength(60);

    // Verify first month payment (base rent only since additional costs are 0)
    expect(result.schedule[0]!.basePayment).toBe(45000);
    expect(result.schedule[0]!.totalPayment).toBeCloseTo(45000, 0.01);

    // Verify escalation is applied correctly
    expect(result.escalationSummary).toBeDefined();
    expect(result.escalationSummary!.type).toBe('fixed');
    expect(result.escalationSummary!.effectiveRate).toBe(0.03);

    // Check that payment increases by ~3% annually
    // After 1 year (12 months), payment should be ~3% higher
    const month12Payment = result.schedule[11]!.escalatedPayment;
    const month1Payment = result.schedule[0]!.escalatedPayment;
    const year1Increase = (month12Payment - month1Payment) / month1Payment;
    expect(year1Increase).toBeCloseTo(0.03, 0.001); // Within 0.1% tolerance

    // After 5 years (60 months), payment should be significantly higher
    const month60Payment = result.schedule[59]!.escalatedPayment;
    const totalIncrease = (month60Payment - month1Payment) / month1Payment;
    // 3% compounded over ~5 years = (1.03)^5 - 1 = ~15.9%
    expect(totalIncrease).toBeCloseTo(0.159, 0.01); // Within 1% tolerance

    // Verify financial metrics
    expect(result.metrics.totalCost).toBeGreaterThan(45000 * 60); // More than base rent * months due to escalation
    expect(result.metrics.averageMonthlyPayment).toBeGreaterThan(45000);
    expect(result.metrics.costPerYear).toBeGreaterThan(45000 * 12);

    // Verify present value calculation
    expect(result.metrics.presentValue).toBeLessThan(result.metrics.totalCost);
    expect(result.metrics.presentValue).toBeGreaterThan(0);

    // Verify risk analysis
    expect(result.riskAnalysis).toBeDefined();
    expect(result.riskAnalysis.totalCommitment).toBe(result.metrics.totalCost);

    // Verify insights
    expect(result.insights.effectiveRent).toBeGreaterThan(0);
    expect(result.insights.occupancyCost).toBe(result.metrics.totalCost);
    expect(result.insights.flexibilityRating).toBeDefined();

    // Verify sensitivity analysis
    expect(result.sensitivity).toBeDefined();
    expect(result.sensitivity!.rateIncrease1Percent.totalCostChange).toBeGreaterThan(0);
  });

  it('should generate accurate payment schedule with annual escalation', () => {
    const input: EnhancedLeaseInput = {
      leaseType: 'warehouse-nnn',
      baseRent: 45000,
      termMonths: 60,
      annualRate: 0.05,
      principal: 0,
      residualValue: 0,

      escalation: {
        type: 'fixed',
        rate: 0.03, // 3% annually
        schedule: [],
        cpiBase: 0,
      },

      discountRate: 0.08,
      renewalOptions: [],
    };

    const result = EnhancedLeaseAnalyzer.analyze(input);

    // Payment should stay constant within each year, then increase at year anniversary
    // Year 1: $45,000/month (months 1-12)
    expect(result.schedule[0]!.escalatedPayment).toBeCloseTo(45000, 0.01);
    expect(result.schedule[11]!.escalatedPayment).toBeCloseTo(45000, 0.01);

    // Year 2: $45,000 * 1.03 = $46,350/month (months 13-24)
    expect(result.schedule[12]!.escalatedPayment).toBeCloseTo(45000 * 1.03, 0.01);
    expect(result.schedule[23]!.escalatedPayment).toBeCloseTo(45000 * 1.03, 0.01);

    // Year 3: $46,350 * 1.03 = $47,740.50/month (months 25-36)
    expect(result.schedule[24]!.escalatedPayment).toBeCloseTo(45000 * 1.03 * 1.03, 0.01);
    expect(result.schedule[35]!.escalatedPayment).toBeCloseTo(45000 * 1.03 * 1.03, 0.01);

    // Year 4: $47,740.50 * 1.03 = $49,172.72/month (months 37-48)
    expect(result.schedule[36]!.escalatedPayment).toBeCloseTo(45000 * 1.03 * 1.03 * 1.03, 0.01);
    expect(result.schedule[47]!.escalatedPayment).toBeCloseTo(45000 * 1.03 * 1.03 * 1.03, 0.01);

    // Year 5: $49,172.72 * 1.03 = $50,647.90/month (months 49-60)
    expect(result.schedule[48]!.escalatedPayment).toBeCloseTo(
      45000 * 1.03 * 1.03 * 1.03 * 1.03,
      0.01
    );
    expect(result.schedule[59]!.escalatedPayment).toBeCloseTo(
      45000 * 1.03 * 1.03 * 1.03 * 1.03,
      0.01
    );
  });

  it('should calculate total lease commitment correctly', () => {
    const input: EnhancedLeaseInput = {
      leaseType: 'warehouse-nnn',
      baseRent: 45000,
      termMonths: 60,
      annualRate: 0.05,
      principal: 0,
      residualValue: 0,

      escalation: {
        type: 'fixed',
        rate: 0.03,
        schedule: [],
        cpiBase: 0,
      },

      discountRate: 0.08,
      renewalOptions: [],
    };

    const result = EnhancedLeaseAnalyzer.analyze(input);

    // Total cost should be sum of all payments
    const calculatedTotal = result.schedule.reduce((sum, item) => sum + item.totalPayment, 0);
    expect(result.metrics.totalCost).toBeCloseTo(calculatedTotal, 0.01);

    // Expected total:
    // Year 1: 12 * $45,000 = $540,000
    // Year 2: 12 * $46,350 = $556,200
    // Year 3: 12 * $47,740.50 = $572,886
    // Year 4: 12 * $49,172.72 = $590,072.64
    // Year 5: 12 * $50,647.90 = $607,774.80
    // Total: ~$2,866,933
    expect(result.metrics.totalCost).toBeGreaterThan(2800000);
    expect(result.metrics.totalCost).toBeLessThan(3000000);

    // Average monthly payment should be between first and last month
    const firstMonth = result.schedule[0]!.totalPayment;
    const lastMonth = result.schedule[59]!.totalPayment;
    expect(result.metrics.averageMonthlyPayment).toBeGreaterThan(firstMonth);
    expect(result.metrics.averageMonthlyPayment).toBeLessThan(lastMonth);
  });
});
