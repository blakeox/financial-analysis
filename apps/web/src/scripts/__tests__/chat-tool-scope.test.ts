import { describe, expect, it, vi } from 'vitest';

vi.mock('@financial-analysis/tools', () => ({
  getToolMetadata(toolName: string) {
    const categories: Record<string, { category: string }> = {
      analyze_amortization: { category: 'loan' },
      analyze_lease: { category: 'lease' },
      analyze_enhanced_lease: { category: 'lease' },
      populate_lease_form: { category: 'lease' },
      ebitda_forecasting: { category: 'business' },
      analyze_cash_flow: { category: 'business' },
      analyze_dcf_valuation: { category: 'valuation' },
      analyze_bond_pricing: { category: 'investment' },
    };

    return categories[toolName] ?? { category: 'business' };
  },
}));

import { filterToolsForContext } from '../chat/tool-scope';
import type { ToolSummary } from '../chat/types';

const TOOLS: ToolSummary[] = [
  { name: 'analyze_amortization', description: 'Amortization' },
  { name: 'analyze_lease', description: 'Lease' },
  { name: 'analyze_enhanced_lease', description: 'Enhanced lease' },
  { name: 'populate_lease_form', description: 'Populate lease form' },
  { name: 'ebitda_forecasting', description: 'EBITDA forecast' },
  { name: 'analyze_cash_flow', description: 'Cash flow' },
  { name: 'analyze_dcf_valuation', description: 'DCF valuation' },
  { name: 'analyze_bond_pricing', description: 'Bond pricing' },
];

describe('filterToolsForContext', () => {
  it('disables tools on non-work surfaces', () => {
    expect(filterToolsForContext('general', TOOLS)).toEqual([]);
    expect(filterToolsForContext('models', TOOLS)).toEqual([]);
  });

  it('keeps only amortization tools on amortization pages', () => {
    expect(filterToolsForContext('amortization', TOOLS)).toEqual([
      { name: 'analyze_amortization', description: 'Amortization' },
    ]);
  });

  it('keeps only lease-specific tools on lease pages', () => {
    expect(filterToolsForContext('lease', TOOLS)).toEqual([
      { name: 'analyze_lease', description: 'Lease' },
      { name: 'analyze_enhanced_lease', description: 'Enhanced lease' },
      { name: 'populate_lease_form', description: 'Populate lease form' },
    ]);
  });

  it('falls back to relevant category-matched tools when a page has no explicit allowlist', () => {
    expect(filterToolsForContext('business-valuation', TOOLS)).toEqual([
      { name: 'ebitda_forecasting', description: 'EBITDA forecast' },
      { name: 'analyze_cash_flow', description: 'Cash flow' },
      { name: 'analyze_dcf_valuation', description: 'DCF valuation' },
    ]);
  });

  it('keeps scenario and business tools for startup planning', () => {
    expect(filterToolsForContext('startup-planning', TOOLS)).toEqual([
      { name: 'ebitda_forecasting', description: 'EBITDA forecast' },
      { name: 'analyze_cash_flow', description: 'Cash flow' },
    ]);
  });
});
