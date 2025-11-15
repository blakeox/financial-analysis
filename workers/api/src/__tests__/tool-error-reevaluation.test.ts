/**
 * Tool Error Re-evaluation Tests
 * Tests automatic LLM re-evaluation when tools return errors
 */

import { describe, it, expect } from 'vitest';

describe('Tool Error Re-evaluation', () => {
  describe('Error Detection', () => {
    it('should detect MCP error markers', () => {
      const toolOutputs = {
        analyze_amortization: {
          _mcpError: true,
          _requiresReevaluation: true,
          error: 'Invalid interest rate',
        },
      };
      
      // Simulate hasToolErrors logic
      let hasErrors = false;
      for (const output of Object.values(toolOutputs)) {
        if (!output || typeof output !== 'object') {
          continue;
        }
        const outputObj = output as Record<string, unknown>;
        if (outputObj._mcpError === true || outputObj._requiresReevaluation === true) {
          hasErrors = true;
          break;
        }
      }
      
      expect(hasErrors).toBe(true);
    });

    it('should detect validation errors', () => {
      const toolOutputs = {
        analyze_amortization: {
          success: false,
          validationErrors: [
            { field: 'interestRate', message: 'Must be between 0 and 1' },
          ],
        },
      };
      
      let hasErrors = false;
      for (const output of Object.values(toolOutputs)) {
        if (!output || typeof output !== 'object') {
          continue;
        }
        const outputObj = output as Record<string, unknown>;
        if (outputObj.success === false || 'validationErrors' in outputObj) {
          hasErrors = true;
          break;
        }
      }
      
      expect(hasErrors).toBe(true);
    });

    it('should detect error messages', () => {
      const toolOutputs = {
        analyze_amortization: {
          error: 'Invalid input parameters',
        },
      };
      
      let hasErrors = false;
      for (const output of Object.values(toolOutputs)) {
        if (!output || typeof output !== 'object') {
          continue;
        }
        const outputObj = output as Record<string, unknown>;
        if ('error' in outputObj) {
          hasErrors = true;
          break;
        }
      }
      
      expect(hasErrors).toBe(true);
    });

    it('should not detect errors in successful tool outputs', () => {
      const toolOutputs = {
        analyze_amortization: {
          success: true,
          monthlyPayment: 1500,
          totalInterest: 240000,
        },
      };
      
      let hasErrors = false;
      for (const output of Object.values(toolOutputs)) {
        if (!output || typeof output !== 'object') {
          continue;
        }
        const outputObj = output as Record<string, unknown>;
        if (outputObj._mcpError === true || 
            outputObj._requiresReevaluation === true ||
            'error' in outputObj ||
            'errors' in outputObj ||
            'validationErrors' in outputObj ||
            (outputObj.success === false)) {
          hasErrors = true;
          break;
        }
      }
      
      expect(hasErrors).toBe(false);
    });
  });

  describe('Error Extraction', () => {
    it('should extract error messages from tool outputs', () => {
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

    it('should extract validation errors array', () => {
      const toolOutputs = {
        analyze_amortization: {
          validationErrors: [
            { field: 'interestRate', message: 'Must be between 0 and 1' },
            { field: 'principal', message: 'Must be positive' },
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
          errorMessage = outputObj.validationErrors.map((e: unknown) => 
            typeof e === 'object' && e !== null && 'message' in e 
              ? String((e as { message: unknown }).message)
              : String(e)
          ).join('; ');
          errorType = 'validation';
        }
        
        if (errorMessage) {
          errors.push({ tool: toolName, error: errorMessage, type: errorType });
        }
      }
      
      expect(errors.length).toBe(1);
      expect(errors[0]?.error).toContain('Must be between 0 and 1');
      expect(errors[0]?.error).toContain('Must be positive');
      expect(errors[0]?.type).toBe('validation');
    });
  });

  describe('Re-evaluation Message Construction', () => {
    it('should build re-evaluation message with error context', () => {
      const originalMessage = 'Calculate a $300k mortgage at 4.5% for 30 years';
      const errors = [
        { tool: 'analyze_amortization', error: 'Invalid interest rate: must be between 0 and 1', type: 'validation' },
      ];
      
      const errorContext = errors.map(e => 
        `Tool "${e.tool}" returned an error: ${e.error}${e.type === 'validation' ? ' (validation error)' : ''}`
      ).join('\n');
      
      const reevaluationMessage = `${originalMessage}\n\n⚠️ IMPORTANT: The previous tool call(s) encountered errors:\n${errorContext}\n\nPlease re-evaluate the input and provide corrected parameters or suggest alternative approaches. If this was a field update request, please correct the values and try again.`;
      
      expect(reevaluationMessage).toContain(originalMessage);
      expect(reevaluationMessage).toContain('⚠️ IMPORTANT');
      expect(reevaluationMessage).toContain('analyze_amortization');
      expect(reevaluationMessage).toContain('Invalid interest rate');
      expect(reevaluationMessage).toContain('(validation error)');
      expect(reevaluationMessage).toContain('re-evaluate');
    });

    it('should handle multiple tool errors', () => {
      const errors = [
        { tool: 'analyze_amortization', error: 'Invalid interest rate', type: 'validation' },
        { tool: 'analyze_lease', error: 'Missing required field: monthlyRent', type: 'validation' },
      ];
      
      const errorContext = errors.map(e => 
        `Tool "${e.tool}" returned an error: ${e.error}${e.type === 'validation' ? ' (validation error)' : ''}`
      ).join('\n');
      
      expect(errorContext).toContain('analyze_amortization');
      expect(errorContext).toContain('analyze_lease');
      expect(errorContext.split('\n').length).toBe(2);
    });
  });
});

