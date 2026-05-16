import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import * as tools from '../index';

import { BreakEvenTool as DirectBreakEvenTool } from '../tools/break-even';
import { BusinessExpansionLoanTool as DirectBusinessExpansionLoanTool } from '../tools/business-expansion-loan';
import { EmployerMatch401kTool as DirectEmployerMatch401kTool } from '../tools/401k-match';
import { MonteCarloInvestmentTool as DirectMonteCarloInvestmentTool } from '../tools/monte-carlo-investment';
import { SocialSecurityTool as DirectSocialSecurityTool } from '../tools/social-security';
import {
  createMCPTools as directCreateMCPTools,
  handleMCPRequest as directHandleMCPRequest,
} from '../mcp/tools';
import {
  buildToolCategoryPrompt as directBuildToolCategoryPrompt,
  categoryDescriptions as directCategoryDescriptions,
  toolMetadata as directToolMetadata,
} from '../mcp/tool-metadata';
import { createEventBus as directCreateEventBus } from '../event-bus';
import { createModelFormController as directCreateModelFormController } from '../forms/model-form-controller';

describe('tools public API barrel', () => {
  it('re-exports representative leaf tools', () => {
    expect(tools.BreakEvenTool).toBe(DirectBreakEvenTool);
    expect(tools.BusinessExpansionLoanTool).toBe(DirectBusinessExpansionLoanTool);
    expect(tools.EmployerMatch401kTool).toBe(DirectEmployerMatch401kTool);
    expect(tools.MonteCarloInvestmentTool).toBe(DirectMonteCarloInvestmentTool);
    expect(tools.SocialSecurityTool).toBe(DirectSocialSecurityTool);
  });

  it('re-exports representative MCP surface', () => {
    expect(tools.createMCPTools).toBe(directCreateMCPTools);
    expect(tools.handleMCPRequest).toBe(directHandleMCPRequest);
    expect(tools.toolMetadata).toBe(directToolMetadata);
    expect(tools.categoryDescriptions).toBe(directCategoryDescriptions);
    expect(tools.buildToolCategoryPrompt).toBe(directBuildToolCategoryPrompt);
  });

  it('re-exports representative shared infra', () => {
    expect(tools.createEventBus).toBe(directCreateEventBus);
    expect(tools.createModelFormController).toBe(directCreateModelFormController);
  });

  it('keeps representative barrel exports usable for consumers', () => {
    expect(typeof tools.BreakEvenTool.execute).toBe('function');
    expect(tools.createMCPTools()).toBeInstanceOf(Array);
    expect(tools.createEventBus()).toHaveProperty('emit');

    const controller = tools.createModelFormController({
      formId: 'public-api-test',
      schema: z.object({
        principal: z.number().nonnegative().default(1000),
      }),
    });

    expect(controller.getValues().principal).toBe(1000);
  });
});
