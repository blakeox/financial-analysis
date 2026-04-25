/**
 * Tests for Mortgage Scenario Planning Calculator - Cache Module
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as formHandling from '../mortgage-scenario-planning/form-handling';
import {
  getCachedResults,
  cacheResults,
  clearCache,
  loadCachedResults,
  saveScenario,
  getSavedScenarios,
  deleteSavedScenario,
} from '../mortgage-scenario-planning/cache';
import { CACHE_KEY, CACHE_DURATION, SAVED_SCENARIOS_KEY } from '../mortgage-scenario-planning/constants';
import type { MortgageScenarioPlanningInput, Scenario } from '../mortgage-scenario-planning/types';

// Mock alert globally
vi.stubGlobal('alert', vi.fn());
vi.stubGlobal('prompt', vi.fn());

const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Mortgage Scenario Planning - Cache', () => {
  const mockInput: MortgageScenarioPlanningInput = {
    homePrice: 400000,
    loanTermYears: 30,
    scenarios: [
      { downPayment: 80000, rate: 6.5, extraPayment: 0, closingCosts: 0 },
      { downPayment: 40000, rate: 6.75, extraPayment: 0, closingCosts: 0 },
    ],
  };

  const mockScenarios: Scenario[] = [
    {
      name: 'Scenario A',
      downPayment: 80000,
      rate: 6.5,
      extraPayment: 0,
      closingCosts: 0,
      principal: 320000,
      monthlyPayment: 2022.65,
      totalInterest: 408154,
      totalCost: 728154,
      payoffMonths: 360,
      hasPMI: false,
      pmiMonthly: 0,
      pmiTotalCost: 0,
      pmiDropMonth: 0,
      monthlyPaymentWithPMI: 2022.65,
      index: 0,
    },
    {
      name: 'Scenario B',
      downPayment: 40000,
      rate: 6.75,
      extraPayment: 0,
      closingCosts: 0,
      principal: 360000,
      monthlyPayment: 2335.41,
      totalInterest: 480748,
      totalCost: 840748,
      payoffMonths: 360,
      hasPMI: true,
      pmiMonthly: 225,
      pmiTotalCost: 13500,
      pmiDropMonth: 60,
      monthlyPaymentWithPMI: 2560.41,
      index: 1,
    },
  ];

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleWarnSpy.mockClear();
  });

  describe('cacheResults', () => {
    it('should store results in localStorage', () => {
      cacheResults(mockInput, mockScenarios);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        CACHE_KEY,
        expect.any(String)
      );
    });

    it('should store correct data structure', () => {
      cacheResults(mockInput, mockScenarios);

      const storedData = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );

      expect(storedData).toHaveProperty('timestamp');
      expect(storedData).toHaveProperty('input');
      expect(storedData).toHaveProperty('scenarios');
      expect(storedData.input).toEqual(mockInput);
      expect(storedData.scenarios).toEqual(mockScenarios);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw
      expect(() => cacheResults(mockInput, mockScenarios)).not.toThrow();
    });
  });

  describe('getCachedResults', () => {
    it('should return null when no cache exists', () => {
      const result = getCachedResults(mockInput);

      expect(result).toBeNull();
    });

    it('should return cached scenarios when input matches', () => {
      // Set up cache
      const cacheData = {
        timestamp: Date.now(),
        input: mockInput,
        scenarios: mockScenarios,
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(cacheData));

      const result = getCachedResults(mockInput);

      expect(result).toEqual(mockScenarios);
    });

    it('should return null when input differs', () => {
      const cacheData = {
        timestamp: Date.now(),
        input: mockInput,
        scenarios: mockScenarios,
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(cacheData));

      const differentInput = { ...mockInput, homePrice: 500000 };
      const result = getCachedResults(differentInput);

      expect(result).toBeNull();
    });

    it('should return null when cache is expired', () => {
      const expiredTimestamp = Date.now() - CACHE_DURATION - 1000;
      const cacheData = {
        timestamp: expiredTimestamp,
        input: mockInput,
        scenarios: mockScenarios,
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(cacheData));

      const result = getCachedResults(mockInput);

      expect(result).toBeNull();
    });

    it('should handle corrupted cache gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('invalid json{{{');

      const result = getCachedResults(mockInput);

      expect(result).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should remove cache from localStorage', () => {
      clearCache();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(CACHE_KEY);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(() => clearCache()).not.toThrow();
    });
  });

  describe('loadCachedResults', () => {
    it('should return null when no cache exists', () => {
      const result = loadCachedResults();

      expect(result).toBeNull();
    });

    it('should return cached data when recent', () => {
      const cacheData = {
        timestamp: Date.now(),
        input: mockInput,
        scenarios: mockScenarios,
      };
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(cacheData));

      const result = loadCachedResults();

      expect(result).not.toBeNull();
      expect(result?.formData).toEqual(mockInput);
      expect(result?.scenarios).toEqual(mockScenarios);
    });
  });

  describe('getSavedScenarios', () => {
    it('should return empty array when no saved scenarios', () => {
      const result = getSavedScenarios();

      expect(result).toEqual([]);
    });

    it('should return saved scenarios', () => {
      const savedScenarios = [
        { id: 1, name: 'My Scenario', input: mockInput, savedAt: new Date().toISOString() },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(savedScenarios));

      const result = getSavedScenarios();

      expect(result).toEqual(savedScenarios);
    });

    it('should handle corrupted data gracefully', () => {
      localStorageMock.getItem.mockReturnValueOnce('not valid json');

      const result = getSavedScenarios();

      expect(result).toEqual([]);
    });
  });

  describe('saveScenario', () => {
    beforeEach(() => {
      vi.spyOn(formHandling, 'parseFormInput').mockReturnValue(mockInput);
    });

    const createForm = () => {
      const form = document.createElement('form');
      form.innerHTML = '<input name="homePrice" value="400000" />';
      return form as HTMLFormElement;
    };

    it('should save a new scenario', () => {
      vi.mocked(prompt).mockReturnValueOnce('Primary plan');

      saveScenario(createForm());

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SAVED_SCENARIOS_KEY,
        expect.any(String)
      );
      expect(alert).toHaveBeenCalledWith('Scenario "Primary plan" saved successfully!');
    });

    it('should append to existing scenarios', () => {
      vi.mocked(prompt).mockReturnValueOnce('Second plan');
      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify([
          { id: 1, name: 'First', input: mockInput, savedAt: new Date().toISOString() },
        ])
      );

      saveScenario(createForm());

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData[1].name).toBe('Second plan');
    });

    it('should skip saving when the prompt is cancelled', () => {
      vi.mocked(prompt).mockReturnValueOnce('');

      saveScenario(createForm());

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(alert).not.toHaveBeenCalled();
    });
  });

  describe('deleteSavedScenario', () => {
    beforeEach(() => {
      localStorageMock.setItem.mockClear();
    });

    it('should remove scenario by id', () => {
      const scenarios = [
        { id: 1, name: 'First', input: mockInput, savedAt: new Date().toISOString() },
        { id: 2, name: 'Second', input: mockInput, savedAt: new Date().toISOString() },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(scenarios));

      deleteSavedScenario(1);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        SAVED_SCENARIOS_KEY,
        expect.any(String)
      );
      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe(2);
    });

    it('should handle non-existent id gracefully', () => {
      const scenarios = [
        { id: 1, name: 'First', input: mockInput, savedAt: new Date().toISOString() },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(scenarios));

      expect(() => deleteSavedScenario(999)).not.toThrow();
    });

    it('should return true on successful deletion', () => {
      const scenarios = [
        { id: 1, name: 'First', input: mockInput, savedAt: new Date().toISOString() },
      ];
      localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(scenarios));

      const result = deleteSavedScenario(1);

      expect(result).toBe(true);
    });

    it('should handle empty scenarios list', () => {
      localStorageMock.getItem.mockReturnValueOnce('[]');

      const result = deleteSavedScenario(1);

      expect(result).toBe(true);
    });
  });
});
