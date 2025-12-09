/**
 * Tests for Mortgage Scenario Planning Calculator - Constants Module
 */

import { describe, it, expect } from 'vitest';
import {
  MIN_SCENARIOS,
  MAX_SCENARIOS,
  SCENARIO_COLORS,
  CACHE_KEY,
  CACHE_DURATION,
  SAVED_SCENARIOS_KEY,
  RECENT_CALCULATIONS_KEY,
  PMI_THRESHOLD_LTV,
  PMI_RATE_ANNUAL,
  REFINANCE_MONTH,
} from '../mortgage-scenario-planning/constants';

describe('Mortgage Scenario Planning - Constants', () => {
  describe('Scenario Limits', () => {
    it('should have MIN_SCENARIOS >= 1', () => {
      expect(MIN_SCENARIOS).toBeGreaterThanOrEqual(1);
    });

    it('should have MAX_SCENARIOS > MIN_SCENARIOS', () => {
      expect(MAX_SCENARIOS).toBeGreaterThan(MIN_SCENARIOS);
    });

    it('should have reasonable MAX_SCENARIOS (not too high)', () => {
      expect(MAX_SCENARIOS).toBeLessThanOrEqual(10);
    });
  });

  describe('Scenario Colors', () => {
    it('should have at least MAX_SCENARIOS colors', () => {
      expect(SCENARIO_COLORS.length).toBeGreaterThanOrEqual(MAX_SCENARIOS);
    });

    it('should have valid color objects', () => {
      SCENARIO_COLORS.forEach(color => {
        expect(color).toHaveProperty('bg');
        expect(color).toHaveProperty('accent');
        expect(color).toHaveProperty('label');
        expect(typeof color.bg).toBe('string');
        expect(typeof color.accent).toBe('string');
        expect(typeof color.label).toBe('string');
      });
    });

    it('should have unique labels', () => {
      const labels = SCENARIO_COLORS.map(c => c.label);
      const uniqueLabels = new Set(labels);
      expect(uniqueLabels.size).toBe(SCENARIO_COLORS.length);
    });
  });

  describe('Cache Settings', () => {
    it('should have a valid cache key', () => {
      expect(typeof CACHE_KEY).toBe('string');
      expect(CACHE_KEY.length).toBeGreaterThan(0);
    });

    it('should have reasonable cache duration (at least 1 minute)', () => {
      expect(CACHE_DURATION).toBeGreaterThanOrEqual(60 * 1000);
    });

    it('should have cache duration less than 1 day', () => {
      expect(CACHE_DURATION).toBeLessThan(24 * 60 * 60 * 1000);
    });
  });

  describe('Storage Keys', () => {
    it('should have unique storage keys', () => {
      const keys = [CACHE_KEY, SAVED_SCENARIOS_KEY, RECENT_CALCULATIONS_KEY];
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });

    it('should have valid saved scenarios key', () => {
      expect(typeof SAVED_SCENARIOS_KEY).toBe('string');
      expect(SAVED_SCENARIOS_KEY.length).toBeGreaterThan(0);
    });

    it('should have valid recent calculations key', () => {
      expect(typeof RECENT_CALCULATIONS_KEY).toBe('string');
      expect(RECENT_CALCULATIONS_KEY.length).toBeGreaterThan(0);
    });
  });

  describe('PMI Constants', () => {
    it('should have valid PMI threshold (80% LTV)', () => {
      expect(PMI_THRESHOLD_LTV).toBe(0.8);
    });

    it('should have positive PMI rate', () => {
      expect(PMI_RATE_ANNUAL).toBeGreaterThan(0);
    });

    it('should have reasonable PMI rate (less than 5%)', () => {
      expect(PMI_RATE_ANNUAL).toBeLessThan(0.05);
    });
  });

  describe('Refinance Settings', () => {
    it('should have positive refinance month', () => {
      expect(REFINANCE_MONTH).toBeGreaterThan(0);
    });

    it('should have refinance month at 5 years (60 months)', () => {
      expect(REFINANCE_MONTH).toBe(60);
    });
  });
});
