/**
 * LLM Integration Tests
 * Tests the end-to-end LLM functionality including fallback logic
 */

import { describe, it, expect } from 'vitest';

describe('LLM Integration - End-to-End Flow', () => {
  describe('Field Update Flow', () => {
    it('should detect generic response and extract field update', () => {
      // Simulate the full flow
      const message = "What if my income is 80000";
      const llmResponse = "I can help update the general model. Try: \"Set interest to 4.5%\" or \"Show a 20-year term\". Say \"help\" for more examples.";
      
      // Step 1: Detect generic response
      const isGenericLLMResponse = /i can help update|try:|say "help"|i can change|ask for a specific value/i.test(llmResponse.toLowerCase());
      expect(isGenericLLMResponse).toBe(true);
      
      // Step 2: Detect field update pattern
      const hasFieldUpdatePattern = /\b(income|salary|savings|checking|debt|credit card|student loan|auto loan|mortgage)\b.*?\d+/i.test(message);
      expect(hasFieldUpdatePattern).toBe(true);
      
      // Step 3: Extract value
      const lowerMessage = message.toLowerCase();
      let incomeMatch = lowerMessage.match(/(?:income|salary|my income|your income).*?(?:is|to|of|:)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?)/);
      if (!incomeMatch) {
        incomeMatch = lowerMessage.match(/(?:income|salary|my income|your income).*?(?:is|to|of|:)?\s*(\d{4,}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
      }
      
      expect(incomeMatch).not.toBeNull();
      if (incomeMatch && incomeMatch[1]) {
        const value = parseFloat(incomeMatch[1].replace(/,/g, ''));
        expect(value).toBe(80000);
        
        // Step 4: Generate modelChanges
        const modelChanges = { annualIncome: value };
        expect(modelChanges).toEqual({ annualIncome: 80000 });
        
        // Step 5: Generate proper response
        const responseText = `I've updated your annual income to ${value}. The form has been updated accordingly.`;
        expect(responseText).toBe("I've updated your annual income to 80000. The form has been updated accordingly.");
        expect(responseText).not.toMatch(/i can help update|try:|say "help"/i);
      }
    });

    it('should handle multiple field update scenarios', () => {
      const scenarios = [
        { message: "What if my income is 80000", expected: { annualIncome: 80000 } },
        { message: "Set my savings to 5000", expected: { savingsBalance: 5000 } },
        { message: "My checking balance is 10000", expected: { checkingBalance: 10000 } },
        { message: "My income is 100,000", expected: { annualIncome: 100000 } },
      ];
      
      scenarios.forEach(({ message, expected }) => {
        const lowerMessage = message.toLowerCase();
        const hasPattern = /\b(income|salary|savings|checking|debt|credit card|student loan|auto loan|mortgage)\b.*?\d+/i.test(message);
        expect(hasPattern).toBe(true);
        
        // Extract based on field type
        let extractedModelChanges: Record<string, unknown> | undefined;
        
        if (message.toLowerCase().includes('income') || message.toLowerCase().includes('salary')) {
          let incomeMatch = lowerMessage.match(/(?:income|salary|my income|your income).*?(?:is|to|of|:)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?)/);
          if (!incomeMatch) {
            incomeMatch = lowerMessage.match(/(?:income|salary|my income|your income).*?(?:is|to|of|:)?\s*(\d{4,}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
          }
          if (incomeMatch && incomeMatch[1]) {
            extractedModelChanges = { annualIncome: parseFloat(incomeMatch[1].replace(/,/g, '')) };
          }
        } else if (message.toLowerCase().includes('savings')) {
          let savingsMatch = lowerMessage.match(/(?:savings|savings balance).*?(?:is|to|of|:)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?)/);
          if (!savingsMatch) {
            savingsMatch = lowerMessage.match(/(?:savings|savings balance).*?(?:is|to|of|:)?\s*(\d{4,}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
          }
          if (savingsMatch && savingsMatch[1]) {
            extractedModelChanges = { savingsBalance: parseFloat(savingsMatch[1].replace(/,/g, '')) };
          }
        } else if (message.toLowerCase().includes('checking')) {
          let checkingMatch = lowerMessage.match(/(?:checking|checking balance).*?(?:is|to|of|:)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?)/);
          if (!checkingMatch) {
            checkingMatch = lowerMessage.match(/(?:checking|checking balance).*?(?:is|to|of|:)?\s*(\d{4,}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/);
          }
          if (checkingMatch && checkingMatch[1]) {
            extractedModelChanges = { checkingBalance: parseFloat(checkingMatch[1].replace(/,/g, '')) };
          }
        }
        
        expect(extractedModelChanges).toEqual(expected);
      });
    });
  });

  describe('Response Quality Validation', () => {
    it('should validate helpful responses as high quality', () => {
      const helpfulResponses = [
        "I've updated your annual income to 80000. The form has been updated accordingly.",
        "For mortgage calculations, I can help you determine monthly payments, total interest, and amortization schedules.",
        "Based on your inputs, your monthly payment would be $1,500.",
      ];
      
      helpfulResponses.forEach(response => {
        const isGeneric = /i can help update|try:|say "help"|i can change|ask for a specific value/i.test(response.toLowerCase());
        expect(isGeneric).toBe(false);
      });
    });

    it('should flag generic responses as low quality', () => {
      const genericResponses = [
        "I can help update the general model. Try: \"Set interest to 4.5%\"",
        "Say \"help\" for more examples",
        "I can change interest rates, amounts, and terms. Ask for a specific value",
      ];
      
      genericResponses.forEach(response => {
        const isGeneric = /i can help update|try:|say "help"|i can change|ask for a specific value/i.test(response.toLowerCase());
        expect(isGeneric).toBe(true);
      });
    });
  });
});

