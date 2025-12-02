/**
 * Calculator Favorites and History System
 *
 * This system manages user's favorite calculators and calculation history
 * using browser localStorage for persistence.
 */

import type { CalculatorConfig } from './CalculatorTemplate';
import { CALCULATOR_CONFIGS } from './CalculatorTemplate';

export interface CalculationHistory {
  id: string;
  calculatorId: string;
  timestamp: number;
  inputs: Record<string, unknown>;
  results?: unknown;
  name?: string;
}

export interface UserPreferences {
  favoriteCalculators: string[];
  recentCalculators: string[];
  defaultCurrency: string;
  theme: 'light' | 'dark' | 'auto';
}

const STORAGE_KEYS = {
  FAVORITES: 'fanalyx_favorite_calculators',
  HISTORY: 'fanalyx_calculation_history',
  PREFERENCES: 'fanalyx_user_preferences',
};

const MAX_HISTORY_ITEMS = 50;
const MAX_RECENT_CALCULATORS = 10;

// Favorites Management
export class CalculatorFavorites {
  static getFavorites(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static addFavorite(calculatorId: string): void {
    const favorites = this.getFavorites();
    if (!favorites.includes(calculatorId)) {
      favorites.push(calculatorId);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    }
  }

  static removeFavorite(calculatorId: string): void {
    const favorites = this.getFavorites();
    const updated = favorites.filter((id) => id !== calculatorId);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
  }

  static isFavorite(calculatorId: string): boolean {
    return this.getFavorites().includes(calculatorId);
  }

  static toggleFavorite(calculatorId: string): boolean {
    if (this.isFavorite(calculatorId)) {
      this.removeFavorite(calculatorId);
      return false;
    } else {
      this.addFavorite(calculatorId);
      return true;
    }
  }

  static getFavoriteCalculators(): CalculatorConfig[] {
    return this.getFavorites()
      .map((id) => CALCULATOR_CONFIGS[id])
      .filter(Boolean);
  }
}

// History Management
export class CalculationHistoryManager {
  static getHistory(): CalculationHistory[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static addCalculation(
    calculatorId: string,
    inputs: Record<string, unknown>,
    results?: unknown,
    name?: string
  ): void {
    const history = this.getHistory();
    const newEntry: CalculationHistory = {
      id: this.generateId(),
      calculatorId,
      timestamp: Date.now(),
      inputs,
      results,
      name,
    };

    // Add to beginning of array
    history.unshift(newEntry);

    // Keep only the most recent items
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmedHistory));

    // Update recent calculators
    this.updateRecentCalculators(calculatorId);
  }

  static getCalculationsForCalculator(calculatorId: string): CalculationHistory[] {
    return this.getHistory().filter((calc) => calc.calculatorId === calculatorId);
  }

  static getRecentCalculations(limit: number = 10): CalculationHistory[] {
    return this.getHistory().slice(0, limit);
  }

  static deleteCalculation(id: string): void {
    const history = this.getHistory();
    const updated = history.filter((calc) => calc.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
  }

  static clearHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }

  static exportHistory(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }

  static importHistory(jsonData: string): boolean {
    try {
      const history = JSON.parse(jsonData);
      if (Array.isArray(history)) {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
        return true;
      }
    } catch {
      // Invalid JSON
    }
    return false;
  }

  private static generateId(): string {
    const randomSuffix = Math.random().toString(36).slice(2, 11);
    return `calc_${Date.now()}_${randomSuffix}`;
  }

  private static updateRecentCalculators(calculatorId: string): void {
    const preferences = UserPreferencesManager.getPreferences();
    const recent = preferences.recentCalculators.filter((id) => id !== calculatorId);
    recent.unshift(calculatorId);
    preferences.recentCalculators = recent.slice(0, MAX_RECENT_CALCULATORS);
    UserPreferencesManager.savePreferences(preferences);
  }
}

// User Preferences Management
export class UserPreferencesManager {
  static getPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return stored ? JSON.parse(stored) : this.getDefaultPreferences();
    } catch {
      return this.getDefaultPreferences();
    }
  }

  static savePreferences(preferences: UserPreferences): void {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  }

  static updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): void {
    const preferences = this.getPreferences();
    preferences[key] = value;
    this.savePreferences(preferences);
  }

  static getRecentCalculators(): CalculatorConfig[] {
    const preferences = this.getPreferences();
    return preferences.recentCalculators.map((id) => CALCULATOR_CONFIGS[id]).filter(Boolean);
  }

  private static getDefaultPreferences(): UserPreferences {
    return {
      favoriteCalculators: [],
      recentCalculators: [],
      defaultCurrency: 'USD',
      theme: 'auto',
    };
  }
}

// Quick Access Utilities
export function getQuickAccessCalculators(): {
  favorites: CalculatorConfig[];
  recent: CalculatorConfig[];
  recommended: CalculatorConfig[];
} {
  return {
    favorites: CalculatorFavorites.getFavoriteCalculators(),
    recent: UserPreferencesManager.getRecentCalculators(),
    recommended: getRecommendedCalculators(),
  };
}

function getRecommendedCalculators(): CalculatorConfig[] {
  // Simple recommendation logic - can be enhanced
  const recommendedIds = ['budget', 'retirement', 'savings-goal'];
  return recommendedIds.map((id) => CALCULATOR_CONFIGS[id]).filter(Boolean);
}

// Calculator Usage Analytics
export function trackCalculatorUsage(
  calculatorId: string,
  action: 'open' | 'calculate' | 'favorite'
): void {
  const usage = {
    calculatorId,
    action,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
  };

  // In a real implementation, this would send to analytics service
  console.log('Calculator usage:', usage);
}

// Storage Management
export function clearAllCalculatorData(): void {
  localStorage.removeItem(STORAGE_KEYS.FAVORITES);
  localStorage.removeItem(STORAGE_KEYS.HISTORY);
  localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
}

export function getStorageUsage(): { used: number; available: number } {
  let used = 0;
  Object.values(STORAGE_KEYS).forEach((key) => {
    const data = localStorage.getItem(key);
    if (data) {
      used += data.length;
    }
  });

  // Estimate available space (this is approximate)
  const available = 5 * 1024 * 1024 - used; // 5MB estimate

  return { used, available };
}
