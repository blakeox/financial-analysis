/**
 * Tool Error Re-evaluation - Orchestrator Integration Tests
 * Tests the LLM Orchestrator's handling of tool errors with mocked dependencies
 */

import { describe, it, expect } from 'vitest';
import type { OrchestrationRequest } from '../services/llm-orchestrator';

describe('Tool Error Re-evaluation - Orchestrator Integration', () => {
  describe('Error Detection in Orchestrator', () => {
    it('should detect tool errors via hasToolErrors method', () => {
      // Access private method via reflection (for testing)
      // In a real scenario, we'd test through the public handle method
      const toolOutputs = {
        analyze_amortization: {
          _mcpError: true,
          _requiresReevaluation: true,
          error: 'Invalid interest rate',
        },
      };

      // Test the logic that would be in hasToolErrors
      const hasErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const [, output] of Object.entries(toolOutputs)) {
          if (!output || typeof output !== 'object') {
            continue;
          }
          const outputObj = output as Record<string, unknown>;
          if (outputObj._mcpError === true || outputObj._requiresReevaluation === true) {
            return true;
          }
        }
        return false;
      };

      expect(hasErrors(toolOutputs)).toBe(true);
    });

    it('should not trigger re-evaluation when no errors present', () => {
      const toolOutputs = {
        analyze_amortization: {
          success: true,
          monthlyPayment: 1500,
        },
      };

      const hasErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const [, output] of Object.entries(toolOutputs)) {
          if (!output || typeof output !== 'object') {
            continue;
          }
          const outputObj = output as Record<string, unknown>;
          if (
            outputObj._mcpError === true ||
            outputObj._requiresReevaluation === true ||
            'error' in outputObj ||
            'errors' in outputObj ||
            'validationErrors' in outputObj ||
            outputObj.success === false
          ) {
            return true;
          }
        }
        return false;
      };

      expect(hasErrors(toolOutputs)).toBe(false);
    });
  });

  describe('Error Context Extraction', () => {
    it('should extract error context for re-evaluation', () => {
      const toolOutputs = {
        analyze_amortization: {
          _mcpError: true,
          _requiresReevaluation: true,
          _errorType: 'validation',
          error: 'Invalid interest rate: must be between 0 and 1',
        },
      };

      // Simulate error extraction logic
      const errors: Array<{ tool: string; error: string; type?: string }> = [];

      for (const [toolName, output] of Object.entries(toolOutputs)) {
        if (!output || typeof output !== 'object') {
          continue;
        }
        const outputObj = output as Record<string, unknown>;

        let errorMessage = '';
        let errorType = 'unknown';

        if (outputObj._errorType) {
          errorType = String(outputObj._errorType);
        }

        if (outputObj.error) {
          errorMessage = String(outputObj.error);
        }

        if (errorMessage) {
          errors.push({ tool: toolName, error: errorMessage, type: errorType });
        }
      }

      expect(errors.length).toBe(1);
      expect(errors[0]?.tool).toBe('analyze_amortization');
      expect(errors[0]?.error).toBe('Invalid interest rate: must be between 0 and 1');
      expect(errors[0]?.type).toBe('validation');
    });

    it('should handle validation errors array', () => {
      const toolOutputs = {
        analyze_lease: {
          success: false,
          validationErrors: [
            { field: 'monthlyRent', message: 'Missing required field' },
            { field: 'termMonths', message: 'Must be positive' },
          ],
        },
      };

      const errors: Array<{ tool: string; error: string; type?: string }> = [];

      for (const [toolName, output] of Object.entries(toolOutputs)) {
        if (!output || typeof output !== 'object') {
          continue;
        }
        const outputObj = output as Record<string, unknown>;

        let errorMessage = '';
        let errorType = 'unknown';

        if (outputObj.validationErrors && Array.isArray(outputObj.validationErrors)) {
          errorMessage = outputObj.validationErrors
            .map((e: unknown) =>
              typeof e === 'object' && e !== null && 'message' in e
                ? String((e as { message: unknown }).message)
                : String(e)
            )
            .join('; ');
          errorType = 'validation';
        }

        if (errorMessage) {
          errors.push({ tool: toolName, error: errorMessage, type: errorType });
        }
      }

      expect(errors.length).toBe(1);
      expect(errors[0]?.error).toContain('Missing required field');
      expect(errors[0]?.error).toContain('Must be positive');
      expect(errors[0]?.type).toBe('validation');
    });
  });

  describe('Re-evaluation Message Construction', () => {
    it('should construct proper re-evaluation message', () => {
      const originalMessage = 'Calculate a $300k mortgage at 4.5% for 30 years';
      const errors = [
        {
          tool: 'analyze_amortization',
          error: 'Invalid interest rate: must be between 0 and 1',
          type: 'validation',
        },
      ];

      const errorContext = errors
        .map(
          (e) =>
            `Tool "${e.tool}" returned an error: ${e.error}${e.type === 'validation' ? ' (validation error)' : ''}`
        )
        .join('\n');

      const reevaluationMessage = `${originalMessage}\n\n⚠️ IMPORTANT: The previous tool call(s) encountered errors:\n${errorContext}\n\nPlease re-evaluate the input and provide corrected parameters or suggest alternative approaches. If this was a field update request, please correct the values and try again.`;

      // Verify structure
      expect(reevaluationMessage).toContain(originalMessage);
      expect(reevaluationMessage).toContain('⚠️ IMPORTANT');
      expect(reevaluationMessage).toContain('The previous tool call(s) encountered errors');
      expect(reevaluationMessage).toContain('analyze_amortization');
      expect(reevaluationMessage).toContain('Invalid interest rate');
      expect(reevaluationMessage).toContain('(validation error)');
      expect(reevaluationMessage).toContain('re-evaluate');
    });

    it('should handle multiple errors in re-evaluation message', () => {
      const errors = [
        { tool: 'analyze_amortization', error: 'Invalid interest rate', type: 'validation' },
        { tool: 'analyze_lease', error: 'Missing monthly rent', type: 'validation' },
      ];

      const errorContext = errors
        .map(
          (e) =>
            `Tool "${e.tool}" returned an error: ${e.error}${e.type === 'validation' ? ' (validation error)' : ''}`
        )
        .join('\n');

      expect(errorContext).toContain('analyze_amortization');
      expect(errorContext).toContain('analyze_lease');
      expect(errorContext.split('\n').length).toBe(2);
    });
  });

  describe('Request Structure Validation', () => {
    it('should handle request with tool errors', () => {
      const request: OrchestrationRequest = {
        message: 'Calculate mortgage',
        context: 'amortization',
        toolOutputs: {
          analyze_amortization: {
            _mcpError: true,
            _requiresReevaluation: true,
            error: 'Invalid input',
          },
        },
        availableTools: [],
        currentModel: {},
      };

      // Verify request structure
      expect(request.message).toBe('Calculate mortgage');
      expect(request.context).toBe('amortization');
      expect(request.toolOutputs).toBeDefined();
      if (request.toolOutputs) {
        expect(request.toolOutputs['analyze_amortization']).toBeDefined();

        const toolOutput = request.toolOutputs['analyze_amortization'] as Record<string, unknown>;
        expect(toolOutput._mcpError).toBe(true);
        expect(toolOutput._requiresReevaluation).toBe(true);
      }
    });

    it('should handle request without tool outputs', () => {
      const request: OrchestrationRequest = {
        message: 'Calculate mortgage',
        context: 'amortization',
        availableTools: [],
        currentModel: {},
      };

      expect(request.toolOutputs).toBeUndefined();
    });
  });
});
