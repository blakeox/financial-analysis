/**
 * Shared helpers for FinancialAnalysisEngine analyzers.
 */

import type { AnalysisInsight, AnalysisRecommendation } from './financial-analysis-engine';

export function asRecord(data: unknown): Record<string, unknown> {
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
}

export function parseMoney(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[$,%\s]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function parsePercent(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1 ? value / 100 : value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/%/g, '').trim();
    const parsed = Number.parseFloat(cleaned);
    if (!Number.isFinite(parsed)) return 0;
    return parsed > 1 ? parsed / 100 : parsed;
  }
  return 0;
}

export function impactFromThreshold(
  value: number,
  mediumAt: number,
  highAt: number
): 'low' | 'medium' | 'high' {
  if (value >= highAt) return 'high';
  if (value >= mediumAt) return 'medium';
  return 'low';
}

export function formatUsd(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}

export function mapStringInsights(
  items: string[],
  category: AnalysisInsight['category'] = 'financial'
): AnalysisInsight[] {
  return items.slice(0, 4).map((description) => ({
    category,
    title: description.length > 48 ? `${description.slice(0, 45)}…` : description,
    description,
    impact: 'medium' as const,
    actionable: true,
  }));
}

export function mapStringRecommendations(items: string[]): AnalysisRecommendation[] {
  return items.slice(0, 3).map((description, index) => ({
    priority: index === 0 ? 'high' : 'medium',
    category: index === 0 ? 'immediate' : 'short-term',
    title: description.length > 48 ? `${description.slice(0, 45)}…` : description,
    description,
    effort: 'medium' as const,
  }));
}
