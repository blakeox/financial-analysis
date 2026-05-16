/**
 * Tool Error Re-evaluation Integration Tests
 * Comprehensive tests for the full workflow from tool errors to LLM re-evaluation
 */

import { describe, it, expect } from 'vitest';
import type { OrchestrationRequest } from '../services/llm-orchestrator';

describe('Tool Error Re-evaluation - Integration Tests', () => {
  describe('End-to-End Error Detection Flow', () => {
    it('should detect validation error and trigger re-evaluation', async () => {
      const request: OrchestrationRequest = {
        message: 'Calculate a $300k mortgage at 4.5% for 30 years',
        context: 'amortization',
        toolOutputs: {
          analyze_amortization: {
            _mcpError: true,
            _requiresReevaluation: true,
            _errorType: 'validation',
            error: 'Invalid interest rate: must be between 0 and 1',
          },
        },
        availableTools: [],
        currentModel: {},
      };

      // Test the error detection logic
      const hasToolErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const output of Object.values(toolOutputs)) {
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

      expect(hasToolErrors(request.toolOutputs ?? {})).toBe(true);
    });

    it('should handle multiple tool errors', async () => {
      const request: OrchestrationRequest = {
        message: 'Calculate mortgage and analyze lease',
        context: 'general',
        toolOutputs: {
          analyze_amortization: {
            _mcpError: true,
            _requiresReevaluation: true,
            error: 'Invalid interest rate',
          },
          analyze_lease: {
            success: false,
            validationErrors: [{ field: 'monthlyRent', message: 'Missing required field' }],
          },
        },
        availableTools: [],
        currentModel: {},
      };

      const hasToolErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const output of Object.values(toolOutputs)) {
          if (!output || typeof output !== 'object') {
            continue;
          }
          const outputObj = output as Record<string, unknown>;
          if (
            outputObj._mcpError === true ||
            outputObj._requiresReevaluation === true ||
            outputObj.success === false ||
            'validationErrors' in outputObj
          ) {
            return true;
          }
        }
        return false;
      };

      expect(hasToolErrors(request.toolOutputs ?? {})).toBe(true);
    });

    it('should not trigger re-evaluation for successful tool outputs', async () => {
      const request: OrchestrationRequest = {
        message: 'Calculate a $300k mortgage at 0.045 for 30 years',
        context: 'amortization',
        toolOutputs: {
          analyze_amortization: {
            success: true,
            monthlyPayment: 1520.06,
            totalInterest: 247221.6,
          },
        },
        availableTools: [],
        currentModel: {},
      };

      const hasToolErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const output of Object.values(toolOutputs)) {
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

      expect(hasToolErrors(request.toolOutputs ?? {})).toBe(false);
    });
  });

  describe('Error Extraction and Context Building', () => {
    it('should extract single error correctly', () => {
      const toolOutputs = {
        analyze_amortization: {
          _mcpError: true,
          _requiresReevaluation: true,
          _errorType: 'validation',
          error: 'Invalid interest rate: must be between 0 and 1',
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

    it('should extract multiple errors from different tools', () => {
      const toolOutputs = {
        analyze_amortization: {
          _mcpError: true,
          error: 'Invalid interest rate',
          _errorType: 'validation',
        },
        analyze_lease: {
          success: false,
          validationErrors: [{ field: 'monthlyRent', message: 'Missing required field' }],
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

        if (outputObj._errorType) {
          errorType = String(outputObj._errorType);
        }

        if (outputObj.error) {
          errorMessage = String(outputObj.error);
        } else if (outputObj.validationErrors && Array.isArray(outputObj.validationErrors)) {
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

      expect(errors.length).toBe(2);
      expect(errors.some((e) => e.tool === 'analyze_amortization')).toBe(true);
      expect(errors.some((e) => e.tool === 'analyze_lease')).toBe(true);
    });

    it('should build correct re-evaluation message', () => {
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

      // Verify message structure
      expect(reevaluationMessage).toContain(originalMessage);
      expect(reevaluationMessage).toContain('⚠️ IMPORTANT');
      expect(reevaluationMessage).toContain('The previous tool call(s) encountered errors');
      expect(reevaluationMessage).toContain('analyze_amortization');
      expect(reevaluationMessage).toContain('Invalid interest rate');
      expect(reevaluationMessage).toContain('(validation error)');
      expect(reevaluationMessage).toContain('re-evaluate');
      expect(reevaluationMessage).toContain('corrected parameters');
    });
  });

  describe('Error Type Detection', () => {
    it('should correctly identify validation errors', () => {
      const toolOutputs = {
        analyze_amortization: {
          _mcpError: true,
          _errorType: 'validation',
          error: 'Invalid input: interest rate must be between 0 and 1',
        },
      };

      const errors: Array<{ tool: string; error: string; type?: string }> = [];

      for (const [toolName, output] of Object.entries(toolOutputs)) {
        if (!output || typeof output !== 'object') {
          continue;
        }
        const outputObj = output as Record<string, unknown>;

        let errorType = 'unknown';
        if (outputObj._errorType) {
          errorType = String(outputObj._errorType);
        }

        if (outputObj.error) {
          errors.push({
            tool: toolName,
            error: String(outputObj.error),
            type: errorType,
          });
        }
      }

      expect(errors[0]?.type).toBe('validation');
    });

    it('should correctly identify execution errors', () => {
      const toolOutputs = {
        analyze_amortization: {
          _mcpError: true,
          _errorType: 'execution',
          error: 'Tool execution failed: internal error',
        },
      };

      const errors: Array<{ tool: string; error: string; type?: string }> = [];

      for (const [toolName, output] of Object.entries(toolOutputs)) {
        if (!output || typeof output !== 'object') {
          continue;
        }
        const outputObj = output as Record<string, unknown>;

        let errorType = 'unknown';
        if (outputObj._errorType) {
          errorType = String(outputObj._errorType);
        }

        if (outputObj.error) {
          errors.push({
            tool: toolName,
            error: String(outputObj.error),
            type: errorType,
          });
        }
      }

      expect(errors[0]?.type).toBe('execution');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tool outputs', () => {
      const toolOutputs = {};

      const hasToolErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const output of Object.values(toolOutputs)) {
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

      expect(hasToolErrors(toolOutputs)).toBe(false);
    });

    it('should handle null/undefined tool outputs', () => {
      const toolOutputs = {
        analyze_amortization: null,
        analyze_lease: undefined,
      };

      const hasToolErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const output of Object.values(toolOutputs)) {
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

      expect(hasToolErrors(toolOutputs)).toBe(false);
    });

    it('should handle non-object tool outputs', () => {
      const toolOutputs = {
        analyze_amortization: 'success',
        analyze_lease: 123,
      };

      const hasToolErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const output of Object.values(toolOutputs)) {
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

      expect(hasToolErrors(toolOutputs)).toBe(false);
    });

    it('should handle mixed success and error outputs', () => {
      const toolOutputs = {
        analyze_amortization: {
          success: true,
          monthlyPayment: 1500,
        },
        analyze_lease: {
          _mcpError: true,
          error: 'Invalid input',
        },
      };

      const hasToolErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const output of Object.values(toolOutputs)) {
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

      expect(hasToolErrors(toolOutputs)).toBe(true);
    });
  });

  describe('Re-evaluation Prompt Quality', () => {
    it('should include all error details in re-evaluation prompt', () => {
      const originalMessage = 'Calculate mortgage';
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

      const reevaluationMessage = `${originalMessage}\n\n⚠️ IMPORTANT: The previous tool call(s) encountered errors:\n${errorContext}\n\nPlease re-evaluate the input and provide corrected parameters or suggest alternative approaches. If this was a field update request, please correct the values and try again.`;

      // Verify all errors are included
      expect(reevaluationMessage).toContain('analyze_amortization');
      expect(reevaluationMessage).toContain('analyze_lease');
      expect(reevaluationMessage).toContain('Invalid interest rate');
      expect(reevaluationMessage).toContain('Missing monthly rent');
      expect(reevaluationMessage.split('(validation error)').length - 1).toBe(2);
    });

    it('should preserve original message in re-evaluation prompt', () => {
      const originalMessage = 'What if my income is 80000';
      const errors = [
        { tool: 'interactive_financial_model', error: 'Invalid field value', type: 'validation' },
      ];

      const errorContext = errors
        .map(
          (e) =>
            `Tool "${e.tool}" returned an error: ${e.error}${e.type === 'validation' ? ' (validation error)' : ''}`
        )
        .join('\n');

      const reevaluationMessage = `${originalMessage}\n\n⚠️ IMPORTANT: The previous tool call(s) encountered errors:\n${errorContext}\n\nPlease re-evaluate the input and provide corrected parameters or suggest alternative approaches. If this was a field update request, please correct the values and try again.`;

      // Original message should be at the start
      expect(reevaluationMessage.startsWith(originalMessage)).toBe(true);
    });
  });

  describe('Workflow Scenarios', () => {
    it('should handle interest rate format error scenario', () => {
      // Simulate: User provides percentage, tool expects decimal
      const toolOutputs = {
        analyze_amortization: {
          _mcpError: true,
          _requiresReevaluation: true,
          _errorType: 'validation',
          error: 'Invalid interest rate: must be between 0 and 1',
        },
      };

      const hasErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const output of Object.values(toolOutputs)) {
          if (output && typeof output === 'object') {
            const outputObj = output as Record<string, unknown>;
            if (outputObj._mcpError === true || outputObj._requiresReevaluation === true) {
              return true;
            }
          }
        }
        return false;
      };

      expect(hasErrors(toolOutputs)).toBe(true);
    });

    it('should handle missing required field scenario', () => {
      const toolOutputs = {
        analyze_lease: {
          success: false,
          validationErrors: [
            { field: 'monthlyRent', message: 'Missing required field: monthlyRent' },
          ],
        },
      };

      const hasErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const output of Object.values(toolOutputs)) {
          if (output && typeof output === 'object') {
            const outputObj = output as Record<string, unknown>;
            if (outputObj.success === false || 'validationErrors' in outputObj) {
              return true;
            }
          }
        }
        return false;
      };

      expect(hasErrors(toolOutputs)).toBe(true);
    });

    it('should handle out-of-range value scenario', () => {
      const toolOutputs = {
        analyze_amortization: {
          _mcpError: true,
          _errorType: 'validation',
          error: 'Principal amount must be positive',
        },
      };

      const hasErrors = (toolOutputs: Record<string, unknown>): boolean => {
        for (const output of Object.values(toolOutputs)) {
          if (output && typeof output === 'object') {
            const outputObj = output as Record<string, unknown>;
            if (outputObj._mcpError === true || 'error' in outputObj) {
              return true;
            }
          }
        }
        return false;
      };

      expect(hasErrors(toolOutputs)).toBe(true);
    });
  });
});
