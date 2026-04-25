import { describe, expect, it } from 'vitest';
import { createMCPTools } from '../mcp/tools';
import {
  buildToolCategoryPrompt,
  categoryDescriptions,
  getAllCategories,
  getToolMetadata,
  getToolsByCategory,
  toolMetadata,
  type ToolCategory,
} from '../mcp/tool-metadata';

describe('tool metadata registry', () => {
  it('keeps every metadata entry aligned with a registered MCP tool', () => {
    const registeredToolNames = createMCPTools().map((tool) => tool.name);
    const registeredTools = new Set(registeredToolNames);
    const metadataKeys = Object.keys(toolMetadata);

    expect(metadataKeys.length).toBeGreaterThan(60);
    for (const toolName of metadataKeys) {
      expect(registeredTools.has(toolName)).toBe(true);
    }
    for (const toolName of registeredToolNames) {
      expect(toolMetadata[toolName], `${toolName} metadata`).toBeDefined();
    }
  });

  it('stores valid categories, keywords, and prompt hints for every entry', () => {
    const validCategories = new Set(Object.keys(categoryDescriptions) as ToolCategory[]);

    for (const [toolName, metadata] of Object.entries(toolMetadata)) {
      expect(validCategories.has(metadata.category)).toBe(true);
      expect(metadata.keywords.length, `${toolName} keywords`).toBeGreaterThan(0);
      expect(metadata.keywords.every((keyword) => keyword.trim().length > 0)).toBe(true);
      expect(metadata.promptHint?.trim().length ?? 0, `${toolName} prompt hint`).toBeGreaterThan(0);
    }
  });

  it('groups tools by category and exposes those categories in the prompt helper', () => {
    const categories = getAllCategories();
    const prompt = buildToolCategoryPrompt();

    expect(categories.length).toBeGreaterThan(5);
    expect(prompt).toContain('Available tool categories:');

    for (const category of categories) {
      const tools = getToolsByCategory(category);

      expect(tools.length, `${category} category size`).toBeGreaterThan(0);
      expect(prompt).toContain(categoryDescriptions[category]);
      expect(prompt).toContain(tools[0]);
    }
  });

  it('returns a safe fallback for unknown tools', () => {
    expect(getToolMetadata('missing_tool')).toEqual({
      keywords: [],
      category: 'business',
      outputFields: [],
      promptHint: 'Financial analysis tool',
    });
  });

  it('keeps representative category assignments stable', () => {
    expect(getToolMetadata('analyze_lease').category).toBe('lease');
    expect(getToolMetadata('analyze_student_loans').category).toBe('loan');
    expect(getToolMetadata('calculate_capm').category).toBe('investment');
    expect(getToolMetadata('analyze_dcf_valuation').category).toBe('valuation');
    expect(getToolMetadata('optimize_budget').category).toBe('budgeting');
    expect(getToolMetadata('cache_document').category).toBe('document');
    expect(getToolMetadata('multi_model_scenario_analysis').category).toBe('scenario');
  });
});
