/**
 * Calculator Migration Utility
 *
 * This utility helps migrate existing calculator pages to use the new
 * modular template system, reducing code duplication and improving maintainability.
 */

import { CALCULATOR_CONFIGS, type CalculatorConfig } from '../components/CalculatorTemplate';

// Migration mapping for existing pages
export const PAGE_MIGRATION_MAP = {
  '/amortization': 'amortization',
  '/auto-loan': 'auto-loan',
  '/retirement': 'retirement',
  '/savings-goal': 'savings-goal',
  '/debt-payoff': 'debt-payoff',
  '/student-loans': 'student-loans',
  '/budget': 'budget',
};

// Function to check if a page can be migrated
export function canMigratePage(path: string): boolean {
  return path in PAGE_MIGRATION_MAP;
}

// Function to get the new calculator ID for a page
export function getCalculatorId(path: string): string | null {
  return PAGE_MIGRATION_MAP[path as keyof typeof PAGE_MIGRATION_MAP] || null;
}

// Function to generate redirect rules for migrated pages
export function generateRedirectRules(): Array<{ from: string; to: string }> {
  return Object.entries(PAGE_MIGRATION_MAP).map(([oldPath, calculatorId]) => ({
    from: oldPath,
    to: `/calculator/${calculatorId}`,
  }));
}

// Function to validate calculator configuration
export function validateCalculatorConfig(config: any): boolean {
  const requiredFields = [
    'id',
    'title',
    'description',
    'category',
    'icon',
    'color',
    'keywords',
    'faqSchema',
    'breadcrumbs',
    'formFields',
    'clientScript',
    'analysisType',
  ];

  return requiredFields.every((field) => field in config);
}

// Function to generate calculator index for models page
export function generateCalculatorIndex(): Array<{
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  url: string;
}> {
  return Object.values(CALCULATOR_CONFIGS).map((config: CalculatorConfig) => ({
    id: config.id,
    title: config.title,
    description: config.description,
    category: config.category,
    icon: config.icon,
    color: config.color,
    url: `/calculator/${config.id}`,
  }));
}

// Function to update models page links
export function updateModelsPageLinks(): Record<string, string> {
  const updates: Record<string, string> = {};

  Object.entries(PAGE_MIGRATION_MAP).forEach(([oldPath, calculatorId]) => {
    updates[oldPath] = `/calculator/${calculatorId}`;
  });

  return updates;
}

// Migration status checker
export function getMigrationStatus(): {
  totalPages: number;
  migratedPages: number;
  remainingPages: string[];
} {
  const allPages = Object.keys(PAGE_MIGRATION_MAP);
  const migratedPages = allPages.filter((page) => canMigratePage(page));
  const remainingPages = allPages.filter((page) => !canMigratePage(page));

  return {
    totalPages: allPages.length,
    migratedPages: migratedPages.length,
    remainingPages,
  };
}
