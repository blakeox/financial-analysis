/**
 * Calculator discovery and lookup helpers.
 */
import type { CalculatorConfig } from './types';
import { CALCULATOR_CONFIGS } from './calculator-configs';

export function searchCalculators(query: string): CalculatorConfig[] {
  const searchTerm = query.toLowerCase();
  return Object.values(CALCULATOR_CONFIGS).filter(
    (calc) =>
      calc.title.toLowerCase().includes(searchTerm) ||
      calc.description.toLowerCase().includes(searchTerm) ||
      calc.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm))
  );
}

export function getCalculatorsByCategory(category: 'personal' | 'business'): CalculatorConfig[] {
  return Object.values(CALCULATOR_CONFIGS).filter((calc) => calc.category === category);
}

export function getCalculatorById(id: string): CalculatorConfig | undefined {
  return CALCULATOR_CONFIGS[id];
}

export function getAllCalculatorIds(): string[] {
  return Object.keys(CALCULATOR_CONFIGS);
}

export function getRandomCalculator(): CalculatorConfig {
  const calculators = Object.values(CALCULATOR_CONFIGS);
  return calculators[Math.floor(Math.random() * calculators.length)];
}
